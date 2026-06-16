import { normalizeOrganisationType } from "@/lib/admin/organisation-types";
import type { AdminDataSourceStatus } from "@/lib/admin/dashboard-data";
import {
  calculatePlatformFeeAmount,
  getPlatformFeeForPlan,
} from "@/lib/fee-settings";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { normalizePlanId, type PlanId } from "@/src/config/pricing";

export type PlatformRevenueTierId =
  | "free_clubs"
  | "pro_clubs"
  | "franchisor_accounts"
  | "clubs_under_franchisors"
  | "enterprise_accounts";

export type PlatformRevenueTierRow = {
  id: PlatformRevenueTierId;
  label: string;
  feePercent: number;
  activeAccounts: number;
  monthlyBookingVolume: number;
  estimatedRevenue: number;
};

export type PlatformRevenueSummary = {
  tiers: PlatformRevenueTierRow[];
  totalEstimatedRevenue: number;
  totalMonthlyVolume: number;
  status: AdminDataSourceStatus;
  hasLivePaymentData: boolean;
};

type ProviderContext = {
  id: string;
  accountStatus: string | null;
  organisationType: string | null;
  parentProviderId: string | null;
  plan: string | null;
};

export const PLATFORM_REVENUE_TIER_DEFINITIONS: {
  id: PlatformRevenueTierId;
  label: string;
  feePlanId: PlanId;
}[] = [
  { id: "free_clubs", label: "Free clubs", feePlanId: "STARTER" },
  { id: "pro_clubs", label: "Pro clubs", feePlanId: "PRO" },
  {
    id: "franchisor_accounts",
    label: "Franchisor accounts",
    feePlanId: "FRANCHISE",
  },
  {
    id: "clubs_under_franchisors",
    label: "Clubs under franchisors",
    feePlanId: "FRANCHISE",
  },
  {
    id: "enterprise_accounts",
    label: "Enterprise accounts",
    feePlanId: "ENTERPRISE",
  },
];

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function isActiveProvider(accountStatus: string | null | undefined): boolean {
  return accountStatus !== "paused" && accountStatus !== "suspended";
}

export function resolveProviderRevenueTier(
  provider: ProviderContext,
): PlatformRevenueTierId {
  const organisationType = normalizeOrganisationType(provider.organisationType);
  const planId = normalizePlanId(provider.plan);

  if (organisationType === "enterprise" || planId === "ENTERPRISE") {
    return "enterprise_accounts";
  }

  if (provider.parentProviderId) {
    return "clubs_under_franchisors";
  }

  if (organisationType === "franchise" || planId === "FRANCHISE") {
    return "franchisor_accounts";
  }

  if (planId === "PRO") {
    return "pro_clubs";
  }

  return "free_clubs";
}

function emptyTierRows(): PlatformRevenueTierRow[] {
  return PLATFORM_REVENUE_TIER_DEFINITIONS.map((tier) => ({
    id: tier.id,
    label: tier.label,
    feePercent: getPlatformFeeForPlan(tier.feePlanId),
    activeAccounts: 0,
    monthlyBookingVolume: 0,
    estimatedRevenue: 0,
  }));
}

export function emptyPlatformRevenueSummary(): PlatformRevenueSummary {
  return {
    tiers: emptyTierRows(),
    totalEstimatedRevenue: 0,
    totalMonthlyVolume: 0,
    status: "unavailable",
    hasLivePaymentData: false,
  };
}

export async function fetchPlatformRevenueSummary(): Promise<PlatformRevenueSummary> {
  if (!isSupabaseConfigured()) {
    return emptyPlatformRevenueSummary();
  }

  const supabase = createSupabaseServerClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [providersResult, sessionsResult, bookingsResult] = await Promise.all([
    supabase
      .from("providers")
      .select(
        `
          id,
          account_status,
          organisation_type,
          parent_provider_id,
          provider_subscriptions ( plan )
        `,
      ),
    supabase.from("sessions").select("id, provider_id"),
    supabase
      .from("bookings")
      .select("session_id, price_paid, status, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  if (providersResult.error || sessionsResult.error || bookingsResult.error) {
    console.error(
      "[Admin platform revenue] Failed to load data:",
      providersResult.error?.message ??
        sessionsResult.error?.message ??
        bookingsResult.error?.message,
    );
    return {
      ...emptyPlatformRevenueSummary(),
      status: "live",
      hasLivePaymentData: false,
    };
  }

  const providerTierById = new Map<string, PlatformRevenueTierId>();
  const activeAccountsByTier = new Map<PlatformRevenueTierId, number>();
  const volumeByTier = new Map<PlatformRevenueTierId, number>();

  for (const tier of PLATFORM_REVENUE_TIER_DEFINITIONS) {
    activeAccountsByTier.set(tier.id, 0);
    volumeByTier.set(tier.id, 0);
  }

  for (const row of providersResult.data ?? []) {
    const subscription = firstRelation(
      row.provider_subscriptions as
        | { plan: string }
        | { plan: string }[]
        | null,
    );

    const context: ProviderContext = {
      id: row.id,
      accountStatus: row.account_status,
      organisationType: row.organisation_type,
      parentProviderId: row.parent_provider_id,
      plan: subscription?.plan ?? null,
    };

    const tierId = resolveProviderRevenueTier(context);
    providerTierById.set(row.id, tierId);

    if (isActiveProvider(context.accountStatus)) {
      activeAccountsByTier.set(
        tierId,
        (activeAccountsByTier.get(tierId) ?? 0) + 1,
      );
    }
  }

  const sessionToProvider = new Map<string, string>();
  for (const session of sessionsResult.data ?? []) {
    sessionToProvider.set(session.id, session.provider_id);
  }

  let hasLivePaymentData = false;

  for (const booking of bookingsResult.data ?? []) {
    if (booking.status === "cancelled") {
      continue;
    }

    const amount = Number(booking.price_paid ?? 0);
    if (amount <= 0) {
      continue;
    }

    const providerId = sessionToProvider.get(booking.session_id);
    if (!providerId) {
      continue;
    }

    const tierId = providerTierById.get(providerId);
    if (!tierId) {
      continue;
    }

    hasLivePaymentData = true;
    volumeByTier.set(tierId, (volumeByTier.get(tierId) ?? 0) + amount);
  }

  const tiers = PLATFORM_REVENUE_TIER_DEFINITIONS.map((tier) => {
    const monthlyBookingVolume = volumeByTier.get(tier.id) ?? 0;
    const feePercent = getPlatformFeeForPlan(tier.feePlanId);

    return {
      id: tier.id,
      label: tier.label,
      feePercent,
      activeAccounts: activeAccountsByTier.get(tier.id) ?? 0,
      monthlyBookingVolume,
      estimatedRevenue: calculatePlatformFeeAmount(
        monthlyBookingVolume,
        feePercent,
      ),
    };
  });

  const totalMonthlyVolume = tiers.reduce(
    (sum, tier) => sum + tier.monthlyBookingVolume,
    0,
  );
  const totalEstimatedRevenue = tiers.reduce(
    (sum, tier) => sum + tier.estimatedRevenue,
    0,
  );

  return {
    tiers,
    totalEstimatedRevenue,
    totalMonthlyVolume,
    status: "live",
    hasLivePaymentData,
  };
}
