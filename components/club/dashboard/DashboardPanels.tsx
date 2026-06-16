import Link from "next/link";
import { EmptyState } from "@/components/club/EmptyState";
import { StatusBadge } from "@/components/club/StatusBadge";
import type { CapacityAlert } from "@/lib/dashboard-metrics";
import type { Booking } from "@/lib/bookings";
import {
  ClubSession,
  formatDay,
  formatTimeRange,
  formatSessionLocation,
} from "@/lib/sessions";
import {
  DashboardPanelLink,
  DashboardSection,
} from "./DashboardCards";

export function TodaysSessionsPanel({ sessions }: { sessions: ClubSession[] }) {
  return (
    <DashboardSection
      title="Today's sessions"
      description="What's running today at your venues"
      action={<DashboardPanelLink href="/club/activities">View activities</DashboardPanelLink>}
      className="lg:col-span-2"
    >
      {sessions.length === 0 ? (
        <EmptyState
          title="Nothing scheduled today"
          description="When an activity runs on today's date or weekday, it will appear here."
          actionLabel="Create activity"
          actionHref="/club/create-session"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {session.sessionTitle}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatSessionLocation(session)} · {formatDay(session.day)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                  {formatTimeRange(session.startTime, session.endTime)}
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  {session.bookings}/{session.capacity} booked
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

export function CapacityAlertsPanel({ alerts }: { alerts: CapacityAlert[] }) {
  return (
    <DashboardSection
      title="Capacity alerts"
      description="Sessions nearing or at full capacity"
      action={<DashboardPanelLink href="/club/activities">Manage</DashboardPanelLink>}
    >
      {alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-zinc-700">All clear</p>
          <p className="mt-1 text-xs text-zinc-500">
            No sessions are above 80% capacity right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.sessionId}
              className={`rounded-xl border px-4 py-3 ${
                alert.severity === "full"
                  ? "border-rose-200 bg-rose-50/70"
                  : "border-amber-200 bg-amber-50/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {alert.sessionTitle}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">{alert.venue}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    alert.severity === "full"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {alert.severity === "full" ? "Full" : "Nearly full"}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className={`h-full rounded-full ${
                    alert.severity === "full" ? "bg-rose-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(alert.fillPercent, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-zinc-600">
                {alert.filled} of {alert.capacity} places · {alert.fillPercent}%
              </p>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

export function RecentBookingsPanel({ bookings }: { bookings: Booking[] }) {
  return (
    <DashboardSection
      title="Recent bookings"
      description="Latest parent sign-ups across your club"
      action={<DashboardPanelLink href="/club/bookings">View all</DashboardPanelLink>}
      className="lg:col-span-2"
    >
      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="When parents book your activities, they'll show up here instantly."
          actionLabel="View activities"
          actionHref="/club/activities"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-1 py-2 font-medium">Child</th>
                <th className="px-1 py-2 font-medium">Parent</th>
                <th className="px-1 py-2 font-medium">Activity</th>
                <th className="px-1 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-zinc-50 last:border-b-0"
                >
                  <td className="py-3 pr-3 font-medium text-zinc-900">
                    {booking.childName}
                  </td>
                  <td className="py-3 pr-3 text-zinc-600">{booking.parentName}</td>
                  <td className="py-3 pr-3 text-zinc-600">
                    {booking.sessionTitle}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardSection>
  );
}

export function ActivityPerformancePanel({
  rows,
  formatCurrency,
}: {
  rows: Array<{
    sessionId: string;
    activity: string;
    venue: string;
    bookings: number;
    capacity: number;
    fillPercent: number;
    revenue: number;
  }>;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <DashboardSection
      title="Activity performance"
      description="Top activities by revenue and fill rate"
      action={<DashboardPanelLink href="/club/activities">All activities</DashboardPanelLink>}
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No activity data yet"
          description="Create your first activity to start tracking performance."
          actionLabel="Create activity"
          actionHref="/club/create-session"
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.sessionId} className="rounded-xl border border-zinc-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/club/sessions/${row.sessionId}/edit`}
                    className="text-sm font-semibold text-zinc-900 transition-colors hover:text-teal-700"
                  >
                    {row.activity}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">{row.venue}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatCurrency(row.revenue)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {row.bookings}/{row.capacity} booked
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-violet-500"
                  style={{ width: `${Math.min(row.fillPercent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
