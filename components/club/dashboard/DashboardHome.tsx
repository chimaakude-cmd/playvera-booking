"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { CompleteSetupCard } from "./CompleteSetupCard";
import { DashboardSubscriptionCard } from "./DashboardSubscriptionCard";
import { DashboardHeader, DashboardQuickActions } from "./DashboardHeader";
import { DashboardStatCard } from "./DashboardCards";
import { RevenueTrendChart, BookingTrendChart } from "./DashboardCharts";
import {
  ActivityPerformancePanel,
  CapacityAlertsPanel,
  RecentBookingsPanel,
  TodaysSessionsPanel,
} from "./DashboardPanels";
import { SessionCapacityWidget } from "./SessionCapacityWidget";
import { ReviewInsightsCard } from "./ReviewInsightsCard";
import { SharePromptBanner } from "@/components/club/share/SharePromptBanner";
import { getBookings, getRecentBookings } from "@/lib/bookings";
import { getClubProfile } from "@/lib/club-profile";
import { DEMO_PROVIDER_ID } from "@/lib/club-widget";
import {
  buildDashboardKpis,
  getActivityPerformance,
  getCapacityAlerts,
  getMonthlyRevenueTrend,
  getTodaysSessions,
  getWeeklyBookingTrend,
} from "@/lib/dashboard-metrics";
import { getTotalUnreadCount } from "@/lib/inbox";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { ClubSession, formatCurrency, getSessions } from "@/lib/sessions";

function DashboardHomeContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [clubName, setClubName] = useState("Club");
  const [profileSlug, setProfileSlug] = useState("playvera-juniors");
  const [providerId, setProviderId] = useState(DEMO_PROVIDER_ID);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setSessions(getSessions());
    const profile = getClubProfile();
    if (profile?.clubName) {
      setClubName(profile.clubName);
      setProfileSlug(profile.publicSlug);
      setProviderId(profile.providerId || DEMO_PROVIDER_ID);
      setLogoUrl(profile.logoUrl);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/club/dashboard");
    }
    if (searchParams.get("setup") === "1") {
      window.history.replaceState({}, "", "/club/dashboard");
    }
  }, [searchParams]);

  if (loading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  const bookings = getBookings();
  const recentBookings = getRecentBookings(6);
  const kpis = buildDashboardKpis(sessions, bookings, formatCurrency);
  const todaysSessions = getTodaysSessions(sessions);
  const capacityAlerts = getCapacityAlerts(sessions, bookings);
  const revenueTrend = getMonthlyRevenueTrend(bookings);
  const bookingTrend = getWeeklyBookingTrend(bookings);
  const activityPerformance = getActivityPerformance(sessions, bookings);

  const todayIso = new Date().toISOString().slice(0, 10);
  const bookingsToday = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.createdAt.slice(0, 10) === todayIso,
  ).length;
  const revenueToday = formatCurrency(
    bookings
      .filter(
        (b) =>
          b.status === "confirmed" && b.createdAt.slice(0, 10) === todayIso,
      )
      .reduce((sum, b) => sum + b.pricePaid, 0),
  );
  const unreadMessages =
    getTotalUnreadCount() + getUnreadNotificationCount();

  return (
    <div className="space-y-6">
      <DashboardHeader
        clubName={clubName}
        bookingsToday={bookingsToday}
        revenueToday={revenueToday}
        unreadMessages={unreadMessages}
      />

      <CompleteSetupCard />

      <DashboardSubscriptionCard />

      <SharePromptBanner
        clubName={clubName}
        slug={profileSlug}
        providerId={providerId}
        logoUrl={logoUrl}
      />

      {showSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 transition-opacity">
          Activity created successfully. It is now visible on your dashboard.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <DashboardStatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TodaysSessionsPanel sessions={todaysSessions} />
        <CapacityAlertsPanel alerts={capacityAlerts} />
      </div>

      <SessionCapacityWidget sessions={sessions} />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentBookingsPanel bookings={recentBookings} />
        <DashboardSectionQuickActions />
      </div>

      <ReviewInsightsCard />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={revenueTrend} />
        <BookingTrendChart data={bookingTrend} />
      </div>

      <ActivityPerformancePanel
        rows={activityPerformance}
        formatCurrency={formatCurrency}
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/club/create-session"
          className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Create activity
        </Link>
        <Link
          href="/club/bookings"
          className="inline-flex rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
        >
          Review bookings
        </Link>
      </div>
    </div>
  );
}

function DashboardSectionQuickActions() {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-base font-semibold text-zinc-900">Quick actions</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Shortcuts for your most common club tasks
        </p>
      </div>
      <div className="p-5">
        <DashboardQuickActions />
      </div>
    </section>
  );
}

export function DashboardHome() {
  return (
    <Suspense fallback={<LoadingState message="Loading your dashboard..." />}>
      <DashboardHomeContent />
    </Suspense>
  );
}
