import { adminListDataSource } from "@/lib/admin/data-source";
import {
  fetchPlatformRevenueSummary,
  resolveProviderRevenueTier,
  type PlatformRevenueSummary,
} from "@/lib/admin/platform-revenue-data";
import type { PlatformFeeByProvider } from "@/lib/admin/types";
import { calculatePlatformFeeAmount, getPlatformFeeForPlan } from "@/lib/fee-settings";
import { getAdminSupabaseClient } from "@/lib/admin/supabase-client";

export type AdminFinanceData = {
  platformRevenue: PlatformRevenueSummary;
  feesByProvider: PlatformFeeByProvider[];
  dataSource: "supabase" | "env_missing";
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function fetchFeesByProvider(): Promise<PlatformFeeByProvider[]> {
  const supabase = getAdminSupabaseClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [providersResult, sessionsResult, bookingsResult] = await Promise.all([
    supabase
      .from("providers")
      .select(
        `
          id,
          name,
          account_status,
          organisation_type,
          parent_provider_id,
          club_profiles ( club_name ),
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
    return [];
  }

  const providerMeta = new Map<
    string,
    { clubName: string; feePercent: number }
  >();

  for (const row of providersResult.data ?? []) {
    const profile = firstRelation(
      row.club_profiles as { club_name: string } | { club_name: string }[] | null,
    );
    const subscription = firstRelation(
      row.provider_subscriptions as { plan: string } | { plan: string }[] | null,
    );
    const tierId = resolveProviderRevenueTier({
      id: row.id,
      accountStatus: row.account_status,
      organisationType: row.organisation_type,
      parentProviderId: row.parent_provider_id,
      plan: subscription?.plan ?? null,
    });
    const feePlanId =
      tierId === "pro_clubs"
        ? "PRO"
        : tierId === "enterprise_accounts"
          ? "ENTERPRISE"
          : tierId === "free_clubs"
            ? "STARTER"
            : "FRANCHISE";

    providerMeta.set(row.id, {
      clubName: profile?.club_name?.trim() || row.name.trim() || "Unnamed club",
      feePercent: getPlatformFeeForPlan(feePlanId),
    });
  }

  const sessionToProvider = new Map<string, string>();
  for (const session of sessionsResult.data ?? []) {
    sessionToProvider.set(session.id, session.provider_id);
  }

  const stats = new Map<
    string,
    { bookings: number; grossRevenue: number; platformFees: number }
  >();

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

    const meta = providerMeta.get(providerId);
    if (!meta) {
      continue;
    }

    const current = stats.get(providerId) ?? {
      bookings: 0,
      grossRevenue: 0,
      platformFees: 0,
    };

    current.bookings += 1;
    current.grossRevenue += amount;
    current.platformFees += calculatePlatformFeeAmount(amount, meta.feePercent);
    stats.set(providerId, current);
  }

  return [...stats.entries()]
    .map(([providerId, values]) => ({
      providerId,
      clubName: providerMeta.get(providerId)?.clubName ?? "Unknown",
      bookings: values.bookings,
      grossRevenue: values.grossRevenue,
      platformFees: values.platformFees,
    }))
    .sort((a, b) => b.platformFees - a.platformFees);
}

export async function fetchAdminFinanceData(): Promise<AdminFinanceData> {
  const dataSource = adminListDataSource();
  if (dataSource === "env_missing") {
    return {
      platformRevenue: await fetchPlatformRevenueSummary(),
      feesByProvider: [],
      dataSource: "env_missing",
    };
  }

  const [platformRevenue, feesByProvider] = await Promise.all([
    fetchPlatformRevenueSummary(),
    fetchFeesByProvider(),
  ]);

  return {
    platformRevenue,
    feesByProvider,
    dataSource: "supabase",
  };
}
