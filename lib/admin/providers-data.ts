import {
  adminPlanToStoredValue,
  getAdminPlanLabel,
  storagePlanToAdminPlan,
  type AdminProviderPlanId,
} from "@/lib/admin/provider-plans";
import {
  normalizeOrganisationType,
  type ProviderOrganisationType,
} from "@/lib/admin/organisation-types";
import type {
  AdminPaymentProviderMode,
  AdminProvider,
  AdminProviderDetail,
  AdminProvidersListResult,
  ProviderAccountStatus,
  ProviderStripeStatus,
} from "@/lib/admin/types";
import { GOCARDLESS_STATUS_LABELS } from "@/lib/gocardless/types";
import { STRIPE_CONNECT_STATUS_LABELS } from "@/lib/stripe-connect/types";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

type ProviderRow = {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  stripe_account_id?: string | null;
  stripe_connect_status?: string | null;
  gocardless_status?: string | null;
  account_status?: string | null;
  payment_method_stripe_card?: boolean | null;
  payment_method_gocardless_dd?: boolean | null;
  payment_method_manual_invoice?: boolean | null;
  organisation_type?: string | null;
  parent_provider_id?: string | null;
  club_profiles?:
    | {
        verified: boolean;
        club_name: string;
        public_slug: string | null;
        short_description: string;
        website: string;
      }
    | {
        verified: boolean;
        club_name: string;
        public_slug: string | null;
        short_description: string;
        website: string;
      }[]
    | null;
  provider_subscriptions?:
    | { plan: string }
    | { plan: string }[]
    | null;
  club_team_members?:
    | {
        first_name: string;
        last_name: string;
        is_owner: boolean;
        status: string;
      }[]
    | null;
};

type RevenueStats = {
  totalRevenue: number;
  totalBookings: number;
  hasPaymentData: boolean;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeStripeStatus(value: string | null | undefined): ProviderStripeStatus {
  const allowed: ProviderStripeStatus[] = [
    "not_connected",
    "action_required",
    "connected",
    "restricted",
    "payouts_enabled",
  ];

  if (value && allowed.includes(value as ProviderStripeStatus)) {
    return value as ProviderStripeStatus;
  }

  return "not_connected";
}

function normalizeAccountStatus(
  value: string | null | undefined,
): ProviderAccountStatus {
  if (value === "paused" || value === "suspended") {
    return value;
  }

  return "active";
}

function isStripeConnected(status: ProviderStripeStatus): boolean {
  return status !== "not_connected";
}

function isGoCardlessConnected(status: string | null | undefined): boolean {
  return status === "connected";
}

export function resolvePaymentProviderMode(
  stripeStatus: ProviderStripeStatus,
  gocardlessStatus: string | null | undefined,
): AdminPaymentProviderMode {
  const stripe = isStripeConnected(stripeStatus);
  const gocardless = isGoCardlessConnected(gocardlessStatus);

  if (stripe && gocardless) {
    return "both";
  }

  if (stripe) {
    return "stripe_only";
  }

  if (gocardless) {
    return "gocardless_only";
  }

  return "not_connected";
}

export const PAYMENT_PROVIDER_MODE_LABELS: Record<AdminPaymentProviderMode, string> =
  {
    stripe_only: "Stripe only",
    gocardless_only: "GoCardless only",
    both: "Stripe + GoCardless",
    not_connected: "Not connected",
  };

function formatPaymentMethods(row: ProviderRow): string {
  const methods: string[] = [];

  if (row.payment_method_stripe_card) {
    methods.push("Card");
  }

  if (row.payment_method_gocardless_dd) {
    methods.push("Direct Debit");
  }

  if (row.payment_method_manual_invoice) {
    methods.push("Manual invoice");
  }

  return methods.length > 0 ? methods.join(", ") : "None";
}

function resolveOwnerName(row: ProviderRow): string {
  const owner = (row.club_team_members ?? []).find(
    (member) => member.is_owner && member.status === "active",
  );

  if (owner) {
    const fullName = `${owner.first_name} ${owner.last_name}`.trim();
    if (fullName) {
      return fullName;
    }
  }

  return "—";
}

function mapProviderRow(
  row: ProviderRow,
  revenue: RevenueStats,
  clubsCount: number,
): AdminProvider {
  const profile = firstRelation(row.club_profiles);
  const subscription = firstRelation(row.provider_subscriptions);
  const stripeStatus = normalizeStripeStatus(row.stripe_connect_status);
  const gocardlessStatus = row.gocardless_status ?? "not_connected";
  const planId = storagePlanToAdminPlan(subscription?.plan);

  return {
    id: row.id,
    clubName: profile?.club_name?.trim() || row.name.trim() || "Unnamed club",
    ownerName: resolveOwnerName(row),
    email: row.email?.trim() || "—",
    organisationType: normalizeOrganisationType(row.organisation_type),
    clubsCount,
    stripeStatus,
    gocardlessStatus,
    paymentProviderMode: resolvePaymentProviderMode(stripeStatus, gocardlessStatus),
    paymentMethodsEnabled: formatPaymentMethods(row),
    paymentMethodStripeCard: Boolean(row.payment_method_stripe_card),
    paymentMethodGoCardlessDd: Boolean(row.payment_method_gocardless_dd),
    paymentMethodManualInvoice: Boolean(row.payment_method_manual_invoice),
    subscriptionPlan: getAdminPlanLabel(planId),
    planId,
    totalRevenue: revenue.totalRevenue,
    hasPaymentData: revenue.hasPaymentData,
    accountStatus: normalizeAccountStatus(row.account_status),
    verified: profile?.verified ?? false,
    joinedAt: row.created_at.slice(0, 10),
  };
}

function mapProviderDetail(
  row: ProviderRow,
  revenue: RevenueStats,
  clubsCount: number,
): AdminProviderDetail {
  const profile = firstRelation(row.club_profiles);
  const base = mapProviderRow(row, revenue, clubsCount);

  return {
    ...base,
    phone: row.phone?.trim() || "—",
    location: row.location?.trim() || "—",
    slug: profile?.public_slug?.trim() || row.slug?.trim() || "—",
    description: profile?.short_description?.trim() || "",
    website: profile?.website?.trim() || "",
    stripeAccountId: row.stripe_account_id?.trim() || "",
    totalBookings: revenue.totalBookings,
    pendingPayout: 0,
    platformFeesPaid: 0,
    paymentMethodStripeCard: Boolean(row.payment_method_stripe_card),
    paymentMethodGoCardlessDd: Boolean(row.payment_method_gocardless_dd),
    paymentMethodManualInvoice: Boolean(row.payment_method_manual_invoice),
  };
}

async function fetchProviderRows(): Promise<ProviderRow[] | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("providers")
    .select(
      `
        id,
        name,
        slug,
        email,
        phone,
        location,
        created_at,
        stripe_account_id,
        stripe_connect_status,
        gocardless_status,
        account_status,
        payment_method_stripe_card,
        payment_method_gocardless_dd,
        payment_method_manual_invoice,
        organisation_type,
        parent_provider_id,
        club_profiles (
          verified,
          club_name,
          public_slug,
          short_description,
          website
        ),
        provider_subscriptions (
          plan
        ),
        club_team_members (
          first_name,
          last_name,
          is_owner,
          status
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin providers] Failed to load providers:", error.message);
    return null;
  }

  return (data ?? []) as unknown as ProviderRow[];
}

async function fetchRevenueByProvider(): Promise<Map<string, RevenueStats> | null> {
  const supabase = createSupabaseServerClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, provider_id");

  if (sessionsError) {
    console.error(
      "[Admin providers] Failed to load sessions for revenue:",
      sessionsError.message,
    );
    return null;
  }

  const sessionToProvider = new Map<string, string>();
  for (const session of sessions ?? []) {
    sessionToProvider.set(session.id, session.provider_id);
  }

  if (sessionToProvider.size === 0) {
    return new Map();
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("session_id, price_paid, status");

  if (bookingsError) {
    console.error(
      "[Admin providers] Failed to load bookings for revenue:",
      bookingsError.message,
    );
    return null;
  }

  const stats = new Map<string, RevenueStats>();

  for (const booking of bookings ?? []) {
    const providerId = sessionToProvider.get(booking.session_id);
    if (!providerId) {
      continue;
    }

    if (booking.status === "cancelled") {
      continue;
    }

    const current = stats.get(providerId) ?? {
      totalRevenue: 0,
      totalBookings: 0,
      hasPaymentData: false,
    };

    current.totalBookings += 1;
    current.totalRevenue += Number(booking.price_paid ?? 0);
    current.hasPaymentData = true;
    stats.set(providerId, current);
  }

  return stats;
}

async function fetchChildClubCounts(): Promise<Map<string, number> | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("providers")
    .select("parent_provider_id")
    .not("parent_provider_id", "is", null);

  if (error) {
    console.error(
      "[Admin providers] Failed to load child club counts:",
      error.message,
    );
    return null;
  }

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    const parentId = row.parent_provider_id as string;
    counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
  }

  return counts;
}

function emptyRevenueStats(): RevenueStats {
  return {
    totalRevenue: 0,
    totalBookings: 0,
    hasPaymentData: false,
  };
}

export async function fetchAdminProvidersList(): Promise<AdminProvidersListResult> {
  if (!isSupabaseConfigured()) {
    return { providers: [], dataSource: "unavailable" };
  }

  const [rows, revenueMap, childClubCounts] = await Promise.all([
    fetchProviderRows(),
    fetchRevenueByProvider(),
    fetchChildClubCounts(),
  ]);

  if (rows === null) {
    return { providers: [], dataSource: "unavailable" };
  }

  const providers = rows.map((row) => {
    const revenue = revenueMap?.get(row.id) ?? emptyRevenueStats();
    const clubsCount = childClubCounts?.get(row.id) ?? 0;
    return mapProviderRow(row, revenue, clubsCount);
  });

  return {
    providers,
    dataSource: "supabase",
  };
}

export async function fetchAdminProviderById(
  providerId: string,
): Promise<AdminProviderDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select(
      `
        id,
        name,
        slug,
        email,
        phone,
        location,
        created_at,
        stripe_account_id,
        stripe_connect_status,
        gocardless_status,
        account_status,
        payment_method_stripe_card,
        payment_method_gocardless_dd,
        payment_method_manual_invoice,
        organisation_type,
        parent_provider_id,
        club_profiles (
          verified,
          club_name,
          public_slug,
          short_description,
          website
        ),
        provider_subscriptions (
          plan
        ),
        club_team_members (
          first_name,
          last_name,
          is_owner,
          status
        )
      `,
    )
    .eq("id", providerId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[Admin providers] Failed to load provider:", error.message);
    }
    return null;
  }

  const revenueMap = await fetchRevenueByProvider();
  const childClubCounts = await fetchChildClubCounts();
  const revenue = revenueMap?.get(providerId) ?? emptyRevenueStats();
  const clubsCount = childClubCounts?.get(providerId) ?? 0;

  return mapProviderDetail(data as ProviderRow, revenue, clubsCount);
}

export function formatProviderRevenue(provider: AdminProvider): string {
  if (!provider.hasPaymentData) {
    return "No payment data yet";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(provider.totalRevenue);
}

export function formatGocardlessStatusLabel(status: string): string {
  return (
    GOCARDLESS_STATUS_LABELS[
      status as keyof typeof GOCARDLESS_STATUS_LABELS
    ] ?? status.replaceAll("_", " ")
  );
}

export function formatStripeStatusLabel(status: ProviderStripeStatus): string {
  return STRIPE_CONNECT_STATUS_LABELS[status];
}

export type AdminProviderUpdatePayload = {
  accountStatus?: ProviderAccountStatus;
  verified?: boolean;
  planId?: AdminProviderPlanId;
  organisationType?: ProviderOrganisationType;
  paymentMethodStripeCard?: boolean;
  paymentMethodGoCardlessDd?: boolean;
  paymentMethodManualInvoice?: boolean;
  clubName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  slug?: string;
  location?: string;
  website?: string;
  description?: string;
};

export async function updateAdminProvider(
  providerId: string,
  payload: AdminProviderUpdatePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = createSupabaseServerClient();

  const providerUpdate: import("@/lib/database.types").Database["public"]["Tables"]["providers"]["Update"] =
    {};

  if (payload.accountStatus) {
    providerUpdate.account_status = payload.accountStatus;
  }

  if (payload.organisationType) {
    providerUpdate.organisation_type = payload.organisationType;
  }

  if (typeof payload.paymentMethodStripeCard === "boolean") {
    providerUpdate.payment_method_stripe_card = payload.paymentMethodStripeCard;
  }

  if (typeof payload.paymentMethodGoCardlessDd === "boolean") {
    providerUpdate.payment_method_gocardless_dd = payload.paymentMethodGoCardlessDd;
  }

  if (typeof payload.paymentMethodManualInvoice === "boolean") {
    providerUpdate.payment_method_manual_invoice = payload.paymentMethodManualInvoice;
  }

  if (payload.email !== undefined) {
    providerUpdate.email = payload.email;
  }

  if (payload.phone !== undefined) {
    providerUpdate.phone = payload.phone;
  }

  if (payload.location !== undefined) {
    providerUpdate.location = payload.location;
  }

  if (Object.keys(providerUpdate).length > 0) {
    const { error } = await supabase
      .from("providers")
      .update(providerUpdate)
      .eq("id", providerId);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const profileUpdate: import("@/lib/database.types").Database["public"]["Tables"]["club_profiles"]["Update"] =
    {};

  if (typeof payload.verified === "boolean") {
    profileUpdate.verified = payload.verified;
  }

  if (payload.clubName !== undefined) {
    profileUpdate.club_name = payload.clubName;
  }

  if (payload.slug !== undefined) {
    profileUpdate.public_slug = payload.slug;
  }

  if (payload.website !== undefined) {
    profileUpdate.website = payload.website;
  }

  if (payload.description !== undefined) {
    profileUpdate.short_description = payload.description;
  }

  if (Object.keys(profileUpdate).length > 0) {
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from("club_profiles")
      .select("id")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (profileLookupError) {
      return { ok: false, error: profileLookupError.message };
    }

    if (existingProfile?.id) {
      const { error } = await supabase
        .from("club_profiles")
        .update(profileUpdate)
        .eq("provider_id", providerId);

      if (error) {
        return { ok: false, error: error.message };
      }
    } else if (payload.clubName !== undefined || typeof payload.verified === "boolean") {
      const { error } = await supabase.from("club_profiles").insert({
        provider_id: providerId,
        club_name: payload.clubName ?? "",
        verified: payload.verified ?? false,
        public_slug: payload.slug ?? null,
        website: payload.website ?? "",
        short_description: payload.description ?? "",
      });

      if (error) {
        return { ok: false, error: error.message };
      }
    }
  }

  if (payload.planId) {
    const storedPlan = adminPlanToStoredValue(payload.planId);

    const { data: existingSubscription, error: subscriptionLookupError } =
      await supabase
        .from("provider_subscriptions")
        .select("id")
        .eq("provider_id", providerId)
        .maybeSingle();

    if (subscriptionLookupError) {
      return { ok: false, error: subscriptionLookupError.message };
    }

    if (existingSubscription?.id) {
      const { error } = await supabase
        .from("provider_subscriptions")
        .update({ plan: storedPlan })
        .eq("provider_id", providerId);

      if (error) {
        return { ok: false, error: error.message };
      }
    } else {
      const { error } = await supabase.from("provider_subscriptions").insert({
        provider_id: providerId,
        plan: storedPlan,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
    }
  }

  if (payload.ownerName) {
    const [firstName, ...rest] = payload.ownerName.trim().split(/\s+/);
    const lastName = rest.join(" ");

    const { data: ownerMember, error: ownerLookupError } = await supabase
      .from("club_team_members")
      .select("id")
      .eq("provider_id", providerId)
      .eq("is_owner", true)
      .maybeSingle();

    if (ownerLookupError) {
      return { ok: false, error: ownerLookupError.message };
    }

    if (ownerMember?.id) {
      const { error } = await supabase
        .from("club_team_members")
        .update({
          first_name: firstName || "",
          last_name: lastName || "",
        })
        .eq("id", ownerMember.id);

      if (error) {
        return { ok: false, error: error.message };
      }
    }
  }

  return { ok: true };
}
