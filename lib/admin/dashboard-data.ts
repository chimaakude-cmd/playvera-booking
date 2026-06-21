import {
  emptyPlatformRevenueSummary,
  fetchPlatformRevenueSummary,
  type PlatformRevenueSummary,
} from "@/lib/admin/platform-revenue-data";
import { isSecretKeyConfigured } from "@/lib/stripe/env";
import {
  isDemoProviderRecord,
} from "@/lib/data/providers/supabase/default-provider";
import { DEMO_PROVIDER_ID } from "@/lib/stripe-connect/types";
import { getAdminSupabaseClient } from "@/lib/admin/supabase-client";
import {
  classifyLoadedProvider,
  loadAllProviderRecords,
} from "@/lib/admin/providers-diagnostics";
import {
  isSupabaseConfigured,
} from "@/lib/supabase";

export type AdminDataSourceStatus = "live" | "no_data" | "env_missing";

export type AdminDashboardSignup = {
  id: string;
  name: string;
  joinedLabel: string;
};

export type AdminDashboardMetrics = {
  totalClubs: number;
  totalCustomers: number;
  clubProfiles: number;
  bookingsLast30Days: number;
};

export type AdminDashboardData = {
  metrics: AdminDashboardMetrics;
  platformMetricsStatus: AdminDataSourceStatus;
  recentSignups: AdminDashboardSignup[];
  recentSignupsStatus: AdminDataSourceStatus;
  platformRevenue: PlatformRevenueSummary;
  supabaseConfigured: boolean;
  stripeConfigured: boolean;
};

function formatRelativeJoinDate(isoDate: string): string {
  const joined = new Date(isoDate);
  const now = Date.now();
  const diffMs = joined.getTime() - now;

  if (Number.isNaN(joined.getTime())) {
    return "Unknown";
  }

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return rtf.format(diffMinutes, "minute");
    }
    return rtf.format(diffHours, "hour");
  }

  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, "month");
  }

  return rtf.format(Math.round(diffDays / 365), "year");
}

async function countRows(
  table: "providers" | "parent_profiles" | "club_profiles" | "bookings",
  filter?: { column: string; value: string },
): Promise<number | null> {
  const supabase = getAdminSupabaseClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (filter) {
    query = query.gte(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) {
    console.error(`[Admin dashboard] Failed to count ${table}:`, error.message);
    return null;
  }

  return count ?? 0;
}

async function countActiveClubs(): Promise<number | null> {
  const supabase = getAdminSupabaseClient();
  const records = await loadAllProviderRecords(supabase);
  const activeCount = records
    .map(classifyLoadedProvider)
    .filter(
      (record) =>
        record.isVisible &&
        record.id !== DEMO_PROVIDER_ID &&
        !isDemoProviderRecord({ id: record.id, name: record.name, slug: record.slug }),
    ).length;

  return activeCount;
}

async function fetchRecentSignups(): Promise<AdminDashboardSignup[] | null> {
  const supabase = getAdminSupabaseClient();
  const records = await loadAllProviderRecords(supabase);

  const activeProviders = records
    .map(classifyLoadedProvider)
    .filter((record) => record.isVisible)
    .filter(
      (record) =>
        record.id !== DEMO_PROVIDER_ID &&
        !isDemoProviderRecord({ id: record.id, name: record.name, slug: record.slug }),
    )
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, 5);

  return activeProviders.map((record) => {
    const profile = record.club_profiles[0];
    return {
      id: record.id,
      name: profile?.club_name?.trim() || record.name.trim() || "Unnamed club",
      joinedLabel: formatRelativeJoinDate(record.created_at),
    };
  });
}

async function countPublicClubProfiles(): Promise<number | null> {
  const supabase = getAdminSupabaseClient();
  const { count, error } = await supabase
    .from("club_profiles")
    .select("*", { count: "exact", head: true })
    .or("published.eq.true,visibility.eq.published");

  if (error) {
    console.error(
      "[Admin dashboard] Failed to count public club profiles:",
      error.message,
    );
    return null;
  }

  return count ?? 0;
}

function emptyDashboardData(): AdminDashboardData {
  const supabaseConfigured = isSupabaseConfigured();
  const stripeConfigured = isSecretKeyConfigured();

  return {
    metrics: {
      totalClubs: 0,
      totalCustomers: 0,
      clubProfiles: 0,
      bookingsLast30Days: 0,
    },
    platformMetricsStatus: supabaseConfigured ? "no_data" : "env_missing",
    recentSignups: [],
    recentSignupsStatus: supabaseConfigured ? "no_data" : "env_missing",
    platformRevenue: emptyPlatformRevenueSummary(supabaseConfigured),
    supabaseConfigured,
    stripeConfigured,
  };
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const supabaseConfigured = isSupabaseConfigured();
  const stripeConfigured = isSecretKeyConfigured();

  if (!supabaseConfigured) {
    return emptyDashboardData();
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalClubs,
    totalCustomers,
    clubProfiles,
    bookingsLast30Days,
    recentSignups,
    platformRevenue,
  ] = await Promise.all([
    countActiveClubs(),
    countRows("parent_profiles"),
    countPublicClubProfiles(),
    countRows("bookings", {
      column: "created_at",
      value: thirtyDaysAgo.toISOString(),
    }),
    fetchRecentSignups(),
    fetchPlatformRevenueSummary(),
  ]);

  const metricsLoaded =
    totalClubs !== null &&
    totalCustomers !== null &&
    clubProfiles !== null &&
    bookingsLast30Days !== null;

  return {
    metrics: {
      totalClubs: totalClubs ?? 0,
      totalCustomers: totalCustomers ?? 0,
      clubProfiles: clubProfiles ?? 0,
      bookingsLast30Days: bookingsLast30Days ?? 0,
    },
    platformMetricsStatus: metricsLoaded ? "live" : "no_data",
    recentSignups: recentSignups ?? [],
    recentSignupsStatus: recentSignups !== null ? "live" : "no_data",
    platformRevenue,
    supabaseConfigured,
    stripeConfigured,
  };
}
