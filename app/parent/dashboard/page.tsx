"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { StatusBadge } from "@/components/club/StatusBadge";
import { getBookings, getTotalSpent, getUpcomingBookings } from "@/lib/bookings";
import { getChildren, getMedicalReviewDueCount } from "@/lib/children";
import { getParentDisplayName } from "@/lib/parent-profile";
import { formatCurrency, formatDay, formatTimeRange } from "@/lib/sessions";

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [welcomeName, setWelcomeName] = useState("Parent");
  const [stats, setStats] = useState({
    upcoming: 0,
    spent: "£0",
    children: 0,
    reviewDue: 0,
  });
  const [nextBooking, setNextBooking] = useState<
    ReturnType<typeof getUpcomingBookings>[number] | null
  >(null);

  useEffect(() => {
    const upcoming = getUpcomingBookings();
    const bookings = getBookings();
    const children = getChildren();

    setWelcomeName(getParentDisplayName());
    setStats({
      upcoming: upcoming.length,
      spent: formatCurrency(getTotalSpent(bookings)),
      children: children.length,
      reviewDue: getMedicalReviewDueCount(),
    });
    setNextBooking(upcoming[0] ?? null);
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${welcomeName}`}
        description="Manage your children, bookings, and profile in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Upcoming bookings", value: String(stats.upcoming) },
          { label: "Total spent", value: stats.spent },
          { label: "Children saved", value: String(stats.children) },
          { label: "Medical info review due", value: String(stats.reviewDue) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Next upcoming booking
        </h2>
        {nextBooking ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-zinc-900">
                {nextBooking.sessionTitle}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {nextBooking.childName} · {formatDay(nextBooking.day)} ·{" "}
                {formatTimeRange(nextBooking.startTime, nextBooking.endTime)}
              </p>
            </div>
            <StatusBadge status={nextBooking.status} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            No upcoming bookings. Browse sessions to book your next activity.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/parent/children"
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Add child
          </Link>
          <Link
            href="/parent/bookings"
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            View bookings
          </Link>
          <Link
            href="/parent/profile"
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Update emergency contact
          </Link>
        </div>
      </div>

      {stats.upcoming === 0 && stats.children === 0 ? (
        <EmptyState
          title="Get started with Activora"
          description="Add your child's profile and book their first session."
          actionLabel="Browse sessions"
          actionHref="/sessions"
        />
      ) : null}
    </div>
  );
}
