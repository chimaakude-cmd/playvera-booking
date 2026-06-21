import type {
  AdminHiddenProvider,
  AdminProvidersDiagnostics,
  OrphanedClubProfile,
  ProviderAuditCounts,
  ProviderDiagnosticRow,
} from "@/lib/admin/types";
import {
  classifyProvider,
  type ProviderHiddenReason,
  type ProviderLifecycleStatus,
} from "@/lib/admin/provider-status";
import { findOrphanedClubAuthUsers } from "@/lib/admin/provider-repair";
import { getAdminSupabaseClientMode, getAdminSupabaseClient } from "@/lib/admin/supabase-client";
import { adminListDataSource } from "@/lib/admin/data-source";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { ProviderRow } from "@/lib/admin/providers-data";

export type LoadedProviderRecord = {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  auth_user_id: string | null;
  stripe_account_id: string | null;
  stripe_connect_status: string | null;
  gocardless_status: string | null;
  account_status: string | null;
  payment_method_stripe_card: boolean | null;
  payment_method_gocardless_dd: boolean | null;
  payment_method_manual_invoice: boolean | null;
  organisation_type: string | null;
  parent_provider_id: string | null;
  vat_registration_number: string | null;
  lifecycle_status: ProviderLifecycleStatus | null;
  onboarding_completed: boolean | null;
  deleted_at: string | null;
  club_profiles: Array<{
    id: string;
    verified: boolean;
    club_name: string;
    public_slug: string | null;
    short_description: string;
    website: string;
    visibility: string | null;
    published: boolean | null;
  }>;
  provider_subscriptions: Array<{ plan: string }>;
  club_team_members: Array<{
    first_name: string;
    last_name: string;
    email: string | null;
    is_owner: boolean;
    status: string;
  }>;
  loadError: string | null;
};

export type ClassifiedProviderRecord = LoadedProviderRecord & {
  lifecycleStatus: ProviderLifecycleStatus;
  hiddenReasons: ProviderHiddenReason[];
  isVisible: boolean;
  lifecycleTab: import("@/lib/admin/provider-status").ProviderLifecycleTab;
  onboardingComplete: boolean;
};

const BASE_PROVIDER_SELECT = `
  id,
  name,
  slug,
  email,
  phone,
  location,
  created_at,
  auth_user_id,
  stripe_account_id,
  stripe_connect_status,
  gocardless_status,
  account_status,
  payment_method_stripe_card,
  payment_method_gocardless_dd,
  payment_method_manual_invoice,
  organisation_type,
  parent_provider_id
`;

const EXTENDED_PROVIDER_SELECT = `${BASE_PROVIDER_SELECT},
  vat_registration_number,
  lifecycle_status,
  onboarding_completed,
  deleted_at`;

function isMissingColumnError(message: string, column: string): boolean {
  return message.toLowerCase().includes(column.toLowerCase());
}

function mapBaseRow(row: Record<string, unknown>): Omit<
  LoadedProviderRecord,
  "club_profiles" | "provider_subscriptions" | "club_team_members" | "loadError"
> {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: (row.slug as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    created_at: String(row.created_at ?? new Date(0).toISOString()),
    auth_user_id: (row.auth_user_id as string | null) ?? null,
    stripe_account_id: (row.stripe_account_id as string | null) ?? null,
    stripe_connect_status: (row.stripe_connect_status as string | null) ?? null,
    gocardless_status: (row.gocardless_status as string | null) ?? null,
    account_status: (row.account_status as string | null) ?? null,
    payment_method_stripe_card:
      (row.payment_method_stripe_card as boolean | null) ?? null,
    payment_method_gocardless_dd:
      (row.payment_method_gocardless_dd as boolean | null) ?? null,
    payment_method_manual_invoice:
      (row.payment_method_manual_invoice as boolean | null) ?? null,
    organisation_type: (row.organisation_type as string | null) ?? null,
    parent_provider_id: (row.parent_provider_id as string | null) ?? null,
    vat_registration_number:
      (row.vat_registration_number as string | null) ?? null,
    lifecycle_status:
      (row.lifecycle_status as ProviderLifecycleStatus | null) ?? null,
    onboarding_completed: (row.onboarding_completed as boolean | null) ?? null,
    deleted_at: (row.deleted_at as string | null) ?? null,
  };
}

export async function loadAllProviderRecords(
  supabase: ReturnType<
    typeof import("@/lib/admin/supabase-client").getAdminSupabaseClient
  >,
): Promise<LoadedProviderRecord[]> {
  let baseRows: Array<Record<string, unknown>> | null = null;
  let baseError: { message: string } | null = null;

  const primary = await supabase
    .from("providers")
    .select(EXTENDED_PROVIDER_SELECT)
    .order("created_at", { ascending: false });

  baseRows = (primary.data ?? null) as Array<Record<string, unknown>> | null;
  baseError = primary.error;

  if (
    baseError &&
    (isMissingColumnError(baseError.message, "lifecycle_status") ||
      isMissingColumnError(baseError.message, "onboarding_completed") ||
      isMissingColumnError(baseError.message, "vat_registration_number"))
  ) {
    const fallback = await supabase
      .from("providers")
      .select(BASE_PROVIDER_SELECT)
      .order("created_at", { ascending: false });
    baseRows = (fallback.data ?? null) as Array<Record<string, unknown>> | null;
    baseError = fallback.error;
  }

  if (baseError) {
    console.error(
      "[Admin providers] Failed to load provider rows:",
      baseError.message,
    );
    return [];
  }

  if ((baseRows ?? []).length === 0) {
    const recovered = await loadProvidersFromRelatedTables(supabase);
    if (recovered.length > 0) {
      baseRows = recovered as Array<Record<string, unknown>>;
    }
  }

  const providerIds = (baseRows ?? []).map((row) => String(row.id));
  if (providerIds.length === 0) {
    return [];
  }

  const [profilesResult, subscriptionsResult, teamResult] = await Promise.all([
    supabase
      .from("club_profiles")
      .select(
        "id, provider_id, verified, club_name, public_slug, short_description, website, visibility, published",
      )
      .in("provider_id", providerIds),
    supabase
      .from("provider_subscriptions")
      .select("provider_id, plan")
      .in("provider_id", providerIds),
    supabase
      .from("club_team_members")
      .select("provider_id, first_name, last_name, email, is_owner, status")
      .in("provider_id", providerIds),
  ]);

  const profileErrors: string[] = [];
  const subscriptionErrors: string[] = [];
  const teamErrors: string[] = [];

  if (profilesResult.error) {
    profileErrors.push(profilesResult.error.message);
    console.error(
      "[Admin providers] Failed to load club profiles:",
      profilesResult.error.message,
    );
  }

  if (subscriptionsResult.error) {
    subscriptionErrors.push(subscriptionsResult.error.message);
    console.error(
      "[Admin providers] Failed to load subscriptions:",
      subscriptionsResult.error.message,
    );
  }

  if (teamResult.error) {
    teamErrors.push(teamResult.error.message);
    console.error(
      "[Admin providers] Failed to load team members:",
      teamResult.error.message,
    );
  }

  const profilesByProvider = new Map<
    string,
    LoadedProviderRecord["club_profiles"]
  >();
  for (const row of profilesResult.data ?? []) {
    const providerId = String(row.provider_id);
    const current = profilesByProvider.get(providerId) ?? [];
    current.push({
      id: String(row.id),
      verified: Boolean(row.verified),
      club_name: String(row.club_name ?? ""),
      public_slug: (row.public_slug as string | null) ?? null,
      short_description: String(row.short_description ?? ""),
      website: String(row.website ?? ""),
      visibility: (row.visibility as string | null) ?? null,
      published: (row.published as boolean | null) ?? null,
    });
    profilesByProvider.set(providerId, current);
  }

  const subscriptionsByProvider = new Map<
    string,
    LoadedProviderRecord["provider_subscriptions"]
  >();
  for (const row of subscriptionsResult.data ?? []) {
    const providerId = String(row.provider_id);
    const current = subscriptionsByProvider.get(providerId) ?? [];
    current.push({ plan: String(row.plan ?? "") });
    subscriptionsByProvider.set(providerId, current);
  }

  const teamByProvider = new Map<
    string,
    LoadedProviderRecord["club_team_members"]
  >();
  for (const row of teamResult.data ?? []) {
    const providerId = String(row.provider_id);
    const current = teamByProvider.get(providerId) ?? [];
    current.push({
      first_name: String(row.first_name ?? ""),
      last_name: String(row.last_name ?? ""),
      email: (row.email as string | null) ?? null,
      is_owner: Boolean(row.is_owner),
      status: String(row.status ?? ""),
    });
    teamByProvider.set(providerId, current);
  }

  return (baseRows ?? []).map((row) => {
    const base = mapBaseRow(row);
    const providerId = base.id;
    const relationErrors = [
      ...profileErrors,
      ...subscriptionErrors,
      ...teamErrors,
    ];

    return {
      ...base,
      club_profiles: profilesByProvider.get(providerId) ?? [],
      provider_subscriptions: subscriptionsByProvider.get(providerId) ?? [],
      club_team_members: teamByProvider.get(providerId) ?? [],
      loadError: relationErrors.length > 0 ? relationErrors.join("; ") : null,
    };
  });
}

async function loadProvidersFromRelatedTables(
  supabase: ReturnType<
    typeof import("@/lib/admin/supabase-client").getAdminSupabaseClient
  >,
): Promise<Array<Record<string, unknown>>> {
  const [profilesResult, sessionsResult] = await Promise.all([
    supabase.from("club_profiles").select("provider_id"),
    supabase.from("sessions").select("provider_id"),
  ]);

  const providerIds = [
    ...new Set(
      [...(profilesResult.data ?? []), ...(sessionsResult.data ?? [])]
        .map((row) => String(row.provider_id))
        .filter(Boolean),
    ),
  ];

  if (providerIds.length === 0) {
    return [];
  }

  const primary = await supabase
    .from("providers")
    .select(EXTENDED_PROVIDER_SELECT)
    .in("id", providerIds)
    .order("created_at", { ascending: false });

  if (primary.error) {
    const fallback = await supabase
      .from("providers")
      .select(BASE_PROVIDER_SELECT)
      .in("id", providerIds)
      .order("created_at", { ascending: false });

    return (fallback.data ?? []) as Array<Record<string, unknown>>;
  }

  return (primary.data ?? []) as Array<Record<string, unknown>>;
}

export async function fetchProviderAuditCounts(): Promise<ProviderAuditCounts | null> {
  const supabase = getAdminSupabaseClient();

  const [
    providersResult,
    clubProfilesResult,
    publicProfilesResult,
    sessionsResult,
    bookingsResult,
  ] = await Promise.all([
    supabase.from("providers").select("id", { count: "exact", head: true }),
    supabase.from("club_profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("club_profiles")
      .select("id", { count: "exact", head: true })
      .or("published.eq.true,visibility.eq.published"),
    supabase.from("sessions").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
  ]);

  if (
    providersResult.error ||
    clubProfilesResult.error ||
    publicProfilesResult.error
  ) {
    console.error("[Admin providers] Failed to load audit counts");
    return null;
  }

  const orphanedClubProfiles = await findOrphanedClubProfiles(supabase);

  return {
    providers: providersResult.count ?? 0,
    clubProfiles: clubProfilesResult.count ?? 0,
    publicClubProfiles: publicProfilesResult.count ?? 0,
    sessions: sessionsResult.count ?? 0,
    bookings: bookingsResult.count ?? 0,
    orphanedClubProfiles: orphanedClubProfiles.length,
  };
}

export async function findOrphanedClubProfiles(
  supabase: ReturnType<
    typeof import("@/lib/admin/supabase-client").getAdminSupabaseClient
  >,
): Promise<OrphanedClubProfile[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from("club_profiles")
    .select("id, provider_id, club_name, public_slug");

  if (profilesError) {
    console.error(
      "[Admin providers] Failed to load club profiles for orphan check:",
      profilesError.message,
    );
    return [];
  }

  const providerIds = [
    ...new Set((profiles ?? []).map((row) => String(row.provider_id))),
  ];

  if (providerIds.length === 0) {
    return [];
  }

  const { data: providers, error: providersError } = await supabase
    .from("providers")
    .select("id")
    .in("id", providerIds);

  if (providersError) {
    console.error(
      "[Admin providers] Failed to load providers for orphan check:",
      providersError.message,
    );
    return [];
  }

  const existingProviderIds = new Set(
    (providers ?? []).map((row) => String(row.id)),
  );

  return (profiles ?? [])
    .filter((row) => !existingProviderIds.has(String(row.provider_id)))
    .map((row) => ({
      clubProfileId: String(row.id),
      providerId: String(row.provider_id),
      clubName: String(row.club_name ?? ""),
      publicSlug: (row.public_slug as string | null) ?? null,
      providerMissing: true,
    }));
}

export function buildProviderDiagnosticRows(
  classified: ClassifiedProviderRecord[],
): ProviderDiagnosticRow[] {
  return classified.map((record) => {
    const profile = record.club_profiles[0] ?? null;

    return {
      providerId: record.id,
      clubProfileId: profile?.id ?? null,
      ownerUserId: record.auth_user_id,
      slug: record.slug ?? profile?.public_slug ?? null,
      isDeleted:
        record.lifecycleStatus === "deleted" || Boolean(record.deleted_at),
      isHidden: !record.isVisible,
      onboardingComplete: record.onboardingComplete,
      publicProfileExists: Boolean(profile),
      lifecycleStatus: record.lifecycleStatus,
    };
  });
}

export function classifyLoadedProvider(
  record: LoadedProviderRecord,
): ClassifiedProviderRecord {
  const profile = record.club_profiles[0] ?? null;
  const hasActiveOwner = record.club_team_members.some(
    (member) => member.is_owner && member.status === "active",
  );

  const classification = classifyProvider({
    authUserId: record.auth_user_id,
    lifecycleStatus: record.lifecycle_status,
    onboardingCompleted: record.onboarding_completed,
    deletedAt: record.deleted_at,
    clubProfileName: profile?.club_name ?? null,
    providerName: record.name,
    hasActiveOwner,
    loadError: record.loadError,
  });

  return {
    ...record,
    lifecycleStatus: classification.lifecycleStatus,
    hiddenReasons: classification.hiddenReasons,
    isVisible: classification.isVisible,
    lifecycleTab: classification.lifecycleTab,
    onboardingComplete: classification.onboardingComplete,
  };
}

export function toLifecycleProvider(
  record: ClassifiedProviderRecord,
  counts: { activitiesCount: number; bookingsCount: number },
  paymentStatus: string,
): AdminHiddenProvider {
  const profile = record.club_profiles[0] ?? null;
  const owner = record.club_team_members.find(
    (member) => member.is_owner && member.status === "active",
  );

  return {
    id: record.id,
    clubName:
      profile?.club_name?.trim() || record.name.trim() || "Unnamed provider",
    ownerEmail: owner?.email?.trim() || record.email?.trim() || "—",
    lifecycleStatus: record.lifecycleStatus,
    lifecycleTab: record.lifecycleTab,
    onboardingComplete: record.onboardingComplete,
    hiddenReasons: record.hiddenReasons,
    queryError: record.loadError,
    createdAt: record.created_at.slice(0, 10),
    activitiesCount: counts.activitiesCount,
    bookingsCount: counts.bookingsCount,
    paymentStatus,
  };
}

async function fetchAnonVisibleProviderCount(): Promise<number | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from("providers")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error(
      "[Admin providers] Failed to count anon-visible providers:",
      error.message,
    );
    return null;
  }

  return count ?? 0;
}

export async function buildAdminProvidersDiagnostics(
  classified: ClassifiedProviderRecord[],
  linkCounts?: Map<string, { activitiesCount: number; bookingsCount: number }>,
): Promise<AdminProvidersDiagnostics | null> {
  if (adminListDataSource() === "env_missing") {
    return null;
  }

  const queryClient = getAdminSupabaseClientMode();
  const totalProviderRows = classified.length;
  const visibleProviders = classified.filter((record) => record.isVisible);
  const supabase = getAdminSupabaseClient();
  const hiddenProviders = classified
    .filter((record) => !record.isVisible)
    .map((record) => {
      const row = loadedRecordToProviderRow(record);
      const stripeStatus = row.stripe_connect_status ?? "not_connected";
      const paymentStatus =
        stripeStatus === "not_connected" && !row.stripe_account_id
          ? "No payment provider yet"
          : stripeStatus.replaceAll("_", " ");
      return toLifecycleProvider(
        record,
        linkCounts?.get(record.id) ?? { activitiesCount: 0, bookingsCount: 0 },
        paymentStatus,
      );
    });
  const [anonVisibleCount, orphanedClubAuthUsers, auditCounts, orphanedClubProfiles] =
    await Promise.all([
    fetchAnonVisibleProviderCount(),
    findOrphanedClubAuthUsers(),
    fetchProviderAuditCounts(),
    findOrphanedClubProfiles(supabase),
  ]);

  let hiddenReason: string | null = null;

  if (hiddenProviders.length > 0) {
    hiddenReason = `${hiddenProviders.length} provider row(s) hidden from the default admin view. See details below.`;
  } else if (
    queryClient === "service_role" &&
    anonVisibleCount !== null &&
    anonVisibleCount < totalProviderRows
  ) {
    hiddenReason = `RLS blocked anon reads: ${totalProviderRows - anonVisibleCount} provider row(s) hidden from the anon key (admin now uses service role).`;
  } else if (queryClient === "anon" && totalProviderRows === 0) {
    hiddenReason =
      "Admin queries are using the anon key without service role — club-scoped RLS may hide all providers. Set SUPABASE_SERVICE_ROLE_KEY on the server.";
  } else if (
    auditCounts &&
    auditCounts.clubProfiles > 0 &&
    totalProviderRows === 0
  ) {
    hiddenReason = `${auditCounts.clubProfiles} club profile(s) exist but no provider rows are visible to admin — run repair or check service role / lifecycle status.`;
  }

  return {
    totalProviderRows,
    totalVisibleRows: visibleProviders.length,
    hiddenCount: hiddenProviders.length,
    hiddenReason,
    queryClient,
    hiddenProviders,
    orphanedClubAuthUsers,
    auditCounts,
    diagnosticRows: buildProviderDiagnosticRows(classified),
    orphanedClubProfiles,
  };
}

export function loadedRecordToProviderRow(record: ClassifiedProviderRecord): ProviderRow {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    email: record.email,
    phone: record.phone,
    location: record.location,
    created_at: record.created_at,
    stripe_account_id: record.stripe_account_id,
    stripe_connect_status: record.stripe_connect_status,
    gocardless_status: record.gocardless_status,
    account_status: record.account_status,
    payment_method_stripe_card: record.payment_method_stripe_card,
    payment_method_gocardless_dd: record.payment_method_gocardless_dd,
    payment_method_manual_invoice: record.payment_method_manual_invoice,
    organisation_type: record.organisation_type,
    parent_provider_id: record.parent_provider_id,
    vat_registration_number: record.vat_registration_number,
    lifecycle_status: record.lifecycle_status,
    club_profiles: record.club_profiles,
    provider_subscriptions: record.provider_subscriptions,
    club_team_members: record.club_team_members,
  };
}
