import type {
  AdminHiddenProvider,
  AdminProvidersDiagnostics,
  OrphanedClubProfile,
  ProviderAuditCounts,
  ProviderDiagnosticRow,
  ProviderRecordsLoadDiagnostics,
} from "@/lib/admin/types";
import {
  classifyProvider,
  PROVIDER_HIDDEN_REASON_LABELS,
  PROVIDER_LIFECYCLE_TAB_LABELS,
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

const EXTENDED_CLUB_PROFILE_SELECT =
  "id, provider_id, verified, club_name, public_slug, short_description, website, visibility, published";

const BASE_CLUB_PROFILE_SELECT =
  "id, provider_id, verified, club_name, public_slug, short_description, website";

const EMPTY_LOAD_DIAGNOSTICS: ProviderRecordsLoadDiagnostics = {
  extendedSelectError: null,
  baseSelectError: null,
  usedBaseFallback: false,
  usedRelatedTablesRecovery: false,
  usedAuditMismatchFallback: false,
  auditProviderCount: null,
};

export type LoadAllProviderRecordsResult = {
  records: LoadedProviderRecord[];
  loadDiagnostics: ProviderRecordsLoadDiagnostics;
};

function shouldFallbackToBaseProviderSelect(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();

  if (lower.includes("does not exist") || lower.includes("schema cache")) {
    return true;
  }

  if (lower.includes("column") && lower.includes("provider")) {
    return true;
  }

  return [
    "vat_registration_number",
    "lifecycle_status",
    "onboarding_completed",
    "deleted_at",
  ].some((column) => lower.includes(column));
}

function shouldFallbackToBaseClubProfileSelect(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();

  if (lower.includes("does not exist") || lower.includes("schema cache")) {
    return true;
  }

  return lower.includes("visibility") || lower.includes("published");
}

async function queryProviderRows(
  supabase: ReturnType<
    typeof import("@/lib/admin/supabase-client").getAdminSupabaseClient
  >,
  select: string,
  options?: { providerIds?: string[] },
): Promise<{
  data: Array<Record<string, unknown>> | null;
  error: { message: string } | null;
}> {
  let query = supabase
    .from("providers")
    .select(select)
    .order("created_at", { ascending: false });

  if (options?.providerIds?.length) {
    query = query.in("id", options.providerIds);
  }

  const result = await query;

  return {
    data: (result.data ?? null) as Array<Record<string, unknown>> | null,
    error: result.error,
  };
}

async function loadProviderBaseRows(
  supabase: ReturnType<
    typeof import("@/lib/admin/supabase-client").getAdminSupabaseClient
  >,
  options?: { providerIds?: string[] },
): Promise<{
  rows: Array<Record<string, unknown>>;
  loadDiagnostics: ProviderRecordsLoadDiagnostics;
}> {
  const extended = await queryProviderRows(
    supabase,
    EXTENDED_PROVIDER_SELECT,
    options,
  );

  if (!extended.error) {
    return {
      rows: extended.data ?? [],
      loadDiagnostics: { ...EMPTY_LOAD_DIAGNOSTICS },
    };
  }

  console.error(
    "[Admin providers] Extended provider select failed:",
    extended.error.message,
  );

  if (!shouldFallbackToBaseProviderSelect(extended.error.message)) {
    console.warn(
      "[Admin providers] Retrying provider list with base select after unexpected error.",
    );
  }

  const base = await queryProviderRows(supabase, BASE_PROVIDER_SELECT, options);

  if (base.error) {
    console.error(
      "[Admin providers] Base provider select failed:",
      base.error.message,
    );

    return {
      rows: [],
      loadDiagnostics: {
        ...EMPTY_LOAD_DIAGNOSTICS,
        extendedSelectError: extended.error.message,
        baseSelectError: base.error.message,
        usedBaseFallback: true,
      },
    };
  }

  return {
    rows: base.data ?? [],
    loadDiagnostics: {
      ...EMPTY_LOAD_DIAGNOSTICS,
      extendedSelectError: extended.error.message,
      usedBaseFallback: true,
    },
  };
}

async function loadProvidersAuditMismatchFallback(
  supabase: ReturnType<
    typeof import("@/lib/admin/supabase-client").getAdminSupabaseClient
  >,
): Promise<{
  rows: Array<Record<string, unknown>>;
  auditProviderCount: number | null;
}> {
  const { count, error: countError } = await supabase
    .from("providers")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.error(
      "[Admin providers] Failed to count providers for audit fallback:",
      countError.message,
    );
    return { rows: [], auditProviderCount: null };
  }

  const auditProviderCount = count ?? 0;
  if (auditProviderCount === 0) {
    return { rows: [], auditProviderCount: 0 };
  }

  const base = await queryProviderRows(supabase, BASE_PROVIDER_SELECT);

  if (base.error) {
    console.error(
      "[Admin providers] Audit mismatch fallback failed:",
      base.error.message,
    );
    return { rows: [], auditProviderCount };
  }

  if ((base.data ?? []).length > 0) {
    console.warn(
      `[Admin providers] Audit mismatch fallback recovered ${base.data?.length ?? 0} of ${auditProviderCount} provider row(s).`,
    );
  }

  return {
    rows: base.data ?? [],
    auditProviderCount,
  };
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
): Promise<LoadAllProviderRecordsResult> {
  let { rows: baseRows, loadDiagnostics } = await loadProviderBaseRows(supabase);

  if (baseRows.length === 0) {
    const recovered = await loadProvidersFromRelatedTables(supabase);
    if (recovered.rows.length > 0) {
      baseRows = recovered.rows;
      loadDiagnostics = {
        ...loadDiagnostics,
        ...recovered.loadDiagnostics,
        usedRelatedTablesRecovery: true,
      };
    }
  }

  if (baseRows.length === 0) {
    const auditFallback = await loadProvidersAuditMismatchFallback(supabase);
    loadDiagnostics = {
      ...loadDiagnostics,
      auditProviderCount: auditFallback.auditProviderCount,
    };

    if (auditFallback.rows.length > 0) {
      baseRows = auditFallback.rows;
      loadDiagnostics = {
        ...loadDiagnostics,
        usedAuditMismatchFallback: true,
      };
    } else if (
      auditFallback.auditProviderCount &&
      auditFallback.auditProviderCount > 0
    ) {
      console.error(
        `[Admin providers] Audit count shows ${auditFallback.auditProviderCount} provider(s) but all list queries returned 0 rows.`,
      );
    }
  }

  const providerIds = baseRows.map((row) => String(row.id));
  if (providerIds.length === 0) {
    return { records: [], loadDiagnostics };
  }

  type ClubProfileQueryRow = {
    id: string;
    provider_id: string;
    verified: boolean;
    club_name: string;
    public_slug: string | null;
    short_description: string;
    website: string;
    visibility?: string | null;
    published?: boolean | null;
  };

  const extendedProfilesResult = await supabase
    .from("club_profiles")
    .select(EXTENDED_CLUB_PROFILE_SELECT)
    .in("provider_id", providerIds);

  let profileRows = (extendedProfilesResult.data ?? null) as
    | ClubProfileQueryRow[]
    | null;
  let profileQueryError = extendedProfilesResult.error;

  if (
    profileQueryError &&
    shouldFallbackToBaseClubProfileSelect(profileQueryError.message)
  ) {
    console.error(
      "[Admin providers] Extended club profile select failed:",
      profileQueryError.message,
    );
    const fallbackProfilesResult = await supabase
      .from("club_profiles")
      .select(BASE_CLUB_PROFILE_SELECT)
      .in("provider_id", providerIds);
    profileRows = (fallbackProfilesResult.data ?? null) as
      | ClubProfileQueryRow[]
      | null;
    profileQueryError = fallbackProfilesResult.error;
  }

  const [subscriptionsResult, teamResult] = await Promise.all([
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

  if (profileQueryError) {
    profileErrors.push(profileQueryError.message);
    console.error(
      "[Admin providers] Failed to load club profiles:",
      profileQueryError.message,
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
  for (const row of profileRows ?? []) {
    const providerId = String(row.provider_id);
    const current = profilesByProvider.get(providerId) ?? [];
    current.push({
      id: String(row.id),
      verified: Boolean(row.verified),
      club_name: String(row.club_name ?? ""),
      public_slug: (row.public_slug as string | null) ?? null,
      short_description: String(row.short_description ?? ""),
      website: String(row.website ?? ""),
      visibility: row.visibility ?? null,
      published: row.published ?? null,
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

  const records = baseRows.map((row) => {
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

  return { records, loadDiagnostics };
}

async function loadProvidersFromRelatedTables(
  supabase: ReturnType<
    typeof import("@/lib/admin/supabase-client").getAdminSupabaseClient
  >,
): Promise<{
  rows: Array<Record<string, unknown>>;
  loadDiagnostics: Pick<
    ProviderRecordsLoadDiagnostics,
    "extendedSelectError" | "baseSelectError" | "usedBaseFallback"
  >;
}> {
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
    return {
      rows: [],
      loadDiagnostics: {
        extendedSelectError: null,
        baseSelectError: null,
        usedBaseFallback: false,
      },
    };
  }

  const loaded = await loadProviderBaseRows(supabase, { providerIds });

  return {
    rows: loaded.rows,
    loadDiagnostics: {
      extendedSelectError: loaded.loadDiagnostics.extendedSelectError,
      baseSelectError: loaded.loadDiagnostics.baseSelectError,
      usedBaseFallback: loaded.loadDiagnostics.usedBaseFallback,
    },
  };
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
    const hiddenReasonLabels = record.hiddenReasons.map(
      (reason) => PROVIDER_HIDDEN_REASON_LABELS[reason],
    );
    const exclusionReason = record.loadError
      ? `Query error: ${record.loadError}`
      : record.lifecycleTab === "active"
        ? "Active — shown in Active tab"
        : `${PROVIDER_LIFECYCLE_TAB_LABELS[record.lifecycleTab]}: ${
            hiddenReasonLabels.join(", ") || record.lifecycleStatus
          }`;

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
      lifecycleTab: record.lifecycleTab,
      hiddenReasons: record.hiddenReasons,
      loadError: record.loadError,
      exclusionReason,
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
  loadDiagnostics?: ProviderRecordsLoadDiagnostics | null,
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

  if (loadDiagnostics?.extendedSelectError && totalProviderRows === 0) {
    hiddenReason = `Provider list query failed on extended columns (${loadDiagnostics.extendedSelectError}). Base fallback ${
      loadDiagnostics.baseSelectError
        ? `also failed (${loadDiagnostics.baseSelectError}).`
        : loadDiagnostics.usedBaseFallback
          ? "was attempted."
          : "was not attempted."
    }`;
  } else if (hiddenProviders.length > 0) {
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
    hiddenReason = `${auditCounts.clubProfiles} club profile(s) exist but no provider rows are visible to admin — check service role / lifecycle columns / PostgREST schema cache.`;
  } else if (
    loadDiagnostics?.auditProviderCount &&
    loadDiagnostics.auditProviderCount > 0 &&
    totalProviderRows === 0
  ) {
    hiddenReason = `DB count shows ${loadDiagnostics.auditProviderCount} provider(s) but admin listing loaded 0 rows after all fallbacks.`;
  }

  return {
    totalProviderRows,
    totalVisibleRows: visibleProviders.length,
    hiddenCount: hiddenProviders.length,
    hiddenReason,
    queryClient,
    loadDiagnostics: loadDiagnostics ?? null,
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
