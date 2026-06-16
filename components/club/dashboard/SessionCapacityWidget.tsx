"use client";

import Link from "next/link";
import type { ClubSession } from "@/lib/sessions";
import {
  getSessionBadgeMetrics,
  isSessionSoldOut,
} from "@/lib/discovery/session-badge";
import { getActiveWaitlistCount } from "@/lib/waitlist/storage";
import { DashboardSection } from "./DashboardCards";

type SessionCapacityWidgetProps = {
  sessions: ClubSession[];
};

export function SessionCapacityWidget({ sessions }: SessionCapacityWidgetProps) {
  const rows = sessions
    .map((session) => {
      const metrics = getSessionBadgeMetrics(session);
      const waitlistCount = getActiveWaitlistCount(session.id);
      const soldOut = isSessionSoldOut(session);

      return {
        session,
        metrics,
        waitlistCount,
        soldOut,
      };
    })
    .filter((row) => row.soldOut || row.metrics.bookingPercentage >= 80)
    .slice(0, 5);

  return (
    <DashboardSection
      title="Capacity & waitlist"
      description="Bookings, remaining spaces, and waitlist demand"
      action={
        <Link
          href="/club/activities"
          className="text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Manage activities
        </Link>
      }
      className="lg:col-span-2"
    >
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No capacity pressure right now
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Sessions nearing or at capacity will appear here with waitlist counts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ session, metrics, waitlistCount, soldOut }) => (
            <div
              key={session.id}
              className={`rounded-xl border px-4 py-3 ${
                soldOut
                  ? "border-rose-200 bg-rose-50/70"
                  : "border-amber-200 bg-amber-50/70"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {session.sessionTitle}
                  </p>
                  {soldOut ? (
                    <p className="mt-1 text-xs font-semibold text-rose-700">
                      Session reached capacity
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-800">Nearly full</p>
                  )}
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                  {waitlistCount} on waitlist
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-zinc-500">Bookings</dt>
                  <dd className="font-semibold text-zinc-900">
                    {metrics.currentBookings}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Remaining</dt>
                  <dd className="font-semibold text-zinc-900">
                    {metrics.remainingSpaces}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Capacity</dt>
                  <dd className="font-semibold text-zinc-900">
                    {metrics.maxCapacity}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className={`h-full rounded-full ${
                    soldOut ? "bg-rose-500" : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(metrics.bookingPercentage, 100)}%`,
                  }}
                />
              </div>

              {soldOut && waitlistCount > 0 ? (
                <p className="mt-3 text-xs text-zinc-600">
                  We recommend clubs also contact families directly if urgent.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
