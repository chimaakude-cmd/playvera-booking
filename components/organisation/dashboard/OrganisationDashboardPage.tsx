"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import {
  getOrganisationDashboardData,
  type FranchiseeClub,
  type OrganisationActivityItem,
  type OrganisationNotificationItem,
} from "@/lib/organisation";

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function StatusBadge({ status }: { status: FranchiseeClub["status"] }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    suspended: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function FranchiseePreview({ clubs }: { clubs: FranchiseeClub[] }) {
  const preview = clubs.slice(0, 4);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Franchisees</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Quick view of clubs across your network.
          </p>
        </div>
        <Link
          href="/organisation/clubs"
          className="text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          View all
        </Link>
      </div>

      <ul className="mt-5 divide-y divide-zinc-100">
        {preview.map((club) => (
          <li
            key={club.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900">{club.name}</p>
              <p className="truncate text-xs text-zinc-500">{club.area}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <StatusBadge status={club.status} />
              <span className="text-xs text-zinc-500">
                {club.bookingsCount} bookings
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotificationsPanel({
  notifications,
}: {
  notifications: OrganisationNotificationItem[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Notifications</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Updates that need your attention.
          </p>
        </div>
        <Link
          href="/organisation/communications"
          className="text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          Inbox
        </Link>
      </div>

      <ul className="mt-5 space-y-3">
        {notifications.map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border px-4 py-3 ${
              item.unread
                ? "border-violet-100 bg-violet-50/50"
                : "border-zinc-100 bg-zinc-50/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900">{item.title}</p>
              {item.unread ? (
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {formatRelativeTime(item.timestamp)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentActivityPanel({
  activity,
}: {
  activity: OrganisationActivityItem[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Recent activity</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Latest events across your franchise network.
      </p>

      <ul className="mt-5 space-y-4">
        {activity.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
            <div>
              <p className="text-sm text-zinc-800">{item.message}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {formatRelativeTime(item.timestamp)}
                {item.clubName ? ` · ${item.clubName}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrganisationOverview({
  organisationName,
  planName,
  activeFranchisees,
  franchiseeCount,
}: {
  organisationName: string;
  planName: string;
  activeFranchisees: number;
  franchiseeCount: number;
}) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-violet-950">
        Organisation overview
      </h2>
      <p className="mt-2 text-sm text-violet-900/80">
        {organisationName} is on the{" "}
        <span className="font-semibold">{planName}</span> plan with{" "}
        <span className="font-semibold">{activeFranchisees}</span> active
        franchisees out of <span className="font-semibold">{franchiseeCount}</span>{" "}
        total clubs.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/organisation/clubs"
          className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
        >
          Manage franchisees
        </Link>
        <Link
          href="/organisation/settings"
          className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50"
        >
          Organisation settings
        </Link>
      </div>
    </section>
  );
}

export function OrganisationDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReturnType<
    typeof getOrganisationDashboardData
  > | null>(null);

  useEffect(() => {
    setData(getOrganisationDashboardData());
    setLoading(false);
  }, []);

  if (loading || !data) {
    return <LoadingState message="Loading organisation dashboard..." />;
  }

  const { organisation, clubs, stats, activity, notifications } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Welcome back, {organisation.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s what&apos;s happening across your franchise network today.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard
          label="Franchisees"
          value={String(stats.franchiseeCount)}
          hint={`${stats.activeFranchisees} active`}
          accent="violet"
        />
        <DashboardStatCard
          label="Active sessions"
          value={String(stats.activeSessions)}
          hint="Running this week"
          accent="teal"
        />
        <DashboardStatCard
          label="Bookings"
          value={String(stats.totalBookings)}
          hint="All franchisee clubs"
          accent="amber"
        />
        <DashboardStatCard
          label="Revenue"
          value={formatCurrency(stats.totalRevenuePence)}
          hint="Group total"
          accent="slate"
        />
        <DashboardStatCard
          label="Pending payouts"
          value={formatCurrency(stats.pendingPayoutsPence)}
          hint="Awaiting release"
          accent="rose"
        />
      </div>

      <OrganisationOverview
        organisationName={organisation.name}
        planName={organisation.plan.planName}
        activeFranchisees={stats.activeFranchisees}
        franchiseeCount={stats.franchiseeCount}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <FranchiseePreview clubs={clubs} />
        <NotificationsPanel notifications={notifications} />
      </div>

      <RecentActivityPanel activity={activity} />
    </div>
  );
}
