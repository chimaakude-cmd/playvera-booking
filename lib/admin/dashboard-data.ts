import {
  emptyPlatformRevenueSummary,
  fetchPlatformRevenueSummary,
  type PlatformRevenueSummary,
} from "@/lib/admin/platform-revenue-data";
import { isSecretKeyConfigured } from "@/lib/stripe/env";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type AdminDataSourceStatus = "live" | "unavailable";

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
  paymentsStatus: AdminDataSourceStatus;
  platformRevenue: PlatformRevenueSummary;
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
  const supabase = createSupabaseServerClient();
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

async function fetchRecentSignups(): Promise<AdminDashboardSignup[] | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[Admin dashboard] Failed to load recent signups:", error.message);
    return null;
  }

  return (data ?? []).map((provider) => ({
    id: provider.id,
    name: provider.name.trim() || "Unnamed club",
    joinedLabel: formatRelativeJoinDate(provider.created_at),
  }));
}

async function countPublishedClubProfiles(): Promise<number | null> {
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from("club_profiles")
    .select("*", { count: "exact", head: true })
    .eq("published", true);

  if (error) {
    console.error(
      "[Admin dashboard] Failed to count published club profiles:",
      error.message,
    );
    return null;
  }

  return count ?? 0;
}

function emptyDashboardData(): AdminDashboardData {
  return {
    metrics: {
      totalClubs: 0,
      totalCustomers: 0,
      clubProfiles: 0,
      bookingsLast30Days: 0,
    },
    platformMetricsStatus: "unavailable",
    recentSignups: [],
    recentSignupsStatus: "unavailable",
    paymentsStatus: "unavailable",
    platformRevenue: emptyPlatformRevenueSummary(),
    stripeConfigured: isSecretKeyConfigured(),
  };
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const stripeConfigured = isSecretKeyConfigured();

  if (!isSupabaseConfigured()) {
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
    countRows("providers"),
    countRows("parent_profiles"),
    countPublishedClubProfiles(),
    countRows("bookings", {
      column: "created_at",
      value: thirtyDaysAgo.toISOString(),
    }),
    fetchRecentSignups(),
    fetchPlatformRevenueSummary(),
  ]);

  return {
    metrics: {
      totalClubs: totalClubs ?? 0,
      totalCustomers: totalCustomers ?? 0,
      clubProfiles: clubProfiles ?? 0,
      bookingsLast30Days: bookingsLast30Days ?? 0,
    },
    platformMetricsStatus: "live",
    recentSignups: recentSignups ?? [],
    recentSignupsStatus: "live",
    paymentsStatus:
      platformRevenue.status === "live" && platformRevenue.hasLivePaymentData
        ? "live"
        : "unavailable",
    platformRevenue,
    stripeConfigured,
  };
}

export function formatAdminDataStatusLabel(
  status: AdminDataSourceStatus,
): "Live data" | "Supabase not configured" {
  return status === "live" ? "Live data" : "Supabase not configured";
}
