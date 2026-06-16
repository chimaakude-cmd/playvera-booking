"use client";

import Link from "next/link";
import { Logo } from "@/components/branding";
import { BRAND_NAME } from "@/lib/brand";
import type { ClubWidgetSettings } from "@/lib/club-widget";
import { getClubProfile } from "@/lib/club-profile";
import {
  ClubSession,
  formatDay,
  formatSessionLocation,
  formatTimeRange,
  getCapacitySummary,
} from "@/lib/sessions";

type EmbedProviderWidgetProps = {
  providerId: string;
  settings: ClubWidgetSettings;
  sessions: ClubSession[];
  clubName?: string;
  logoUrl?: string | null;
};

function cardClassName(style: ClubWidgetSettings["cardStyle"]): string {
  switch (style) {
    case "bordered":
      return "rounded-2xl border-2 border-zinc-200 bg-white";
    case "elevated":
      return "rounded-2xl border border-zinc-100 bg-white shadow-lg";
    default:
      return "rounded-2xl border border-zinc-200/80 bg-white shadow-sm";
  }
}

function EmbedSessionCard({
  session,
  settings,
}: {
  session: ClubSession;
  settings: ClubWidgetSettings;
}) {
  const fillPercent =
    session.capacity > 0
      ? Math.min(100, Math.round((session.bookings / session.capacity) * 100))
      : 0;

  const isCompact = settings.layout === "compact";

  return (
    <article className={`overflow-hidden ${cardClassName(settings.cardStyle)}`}>
      {!isCompact ? (
        <div className="aspect-[16/10] bg-gradient-to-br from-zinc-100 via-zinc-50 to-teal-50" />
      ) : null}
      <div className={isCompact ? "space-y-2 p-3" : "space-y-3 p-4"}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-semibold text-zinc-900 ${isCompact ? "text-sm" : "text-base"}`}
          >
            {session.sessionTitle}
          </h3>
          {settings.showAgeRange ? (
            <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
              {session.ageRange || "All ages"}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-zinc-600">
          {formatDay(session.day)} ·{" "}
          {formatTimeRange(session.startTime, session.endTime)}
        </p>
        <p className="text-xs text-zinc-500">
          {formatSessionLocation(session)}
        </p>
        {settings.showAvailability ? (
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Availability</span>
              <span>
                {session.bookings}/{getCapacitySummary(session)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        ) : null}
        <Link
          href={`/book/${session.id}`}
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 ${isCompact ? "py-2" : ""}`}
          style={{ backgroundColor: settings.buttonColor }}
        >
          Book now
        </Link>
      </div>
    </article>
  );
}

export function EmbedProviderWidget({
  settings,
  sessions,
  clubName,
  logoUrl,
}: EmbedProviderWidgetProps) {
  const profile = getClubProfile();
  const displayName = clubName ?? profile?.clubName ?? "Activities";
  const displayLogo = logoUrl ?? profile?.logoUrl;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {settings.showProviderLogo ? (
          <header className="mb-6 flex items-center gap-4">
            {displayLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayLogo}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-lg font-bold text-zinc-500">
                {displayName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">
                {displayName}
              </h1>
              <p className="text-sm text-zinc-500">Book an activity</p>
            </div>
          </header>
        ) : (
          <h1 className="mb-6 text-xl font-semibold text-zinc-900">
            Book an activity
          </h1>
        )}

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">
              No bookable sessions right now
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Check back soon for upcoming activities.
            </p>
          </div>
        ) : (
          <div
            className={
              settings.layout === "compact"
                ? "space-y-3"
                : "grid gap-4 sm:grid-cols-2"
            }
          >
            {sessions.map((session) => (
              <EmbedSessionCard
                key={session.id}
                session={session}
                settings={settings}
              />
            ))}
          </div>
        )}

        {settings.showPoweredBy ? (
          <footer className="mt-10 border-t border-zinc-200 pt-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Logo size="mobile" href="/" />
              <Link
                href="/"
                className="text-xs font-medium text-zinc-400 transition-opacity hover:opacity-80"
              >
                Powered by {BRAND_NAME}
              </Link>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function filterSessionsForWidget(
  sessions: ClubSession[],
  settings: ClubWidgetSettings,
): ClubSession[] {
  let filtered = sessions.filter((session) => session.published !== false);

  if (settings.activityScope === "selected" && settings.selectedActivityIds.length > 0) {
    filtered = filtered.filter((session) =>
      settings.selectedActivityIds.includes(session.id),
    );
  }

  if (settings.activityScope === "venue" && settings.venueId) {
    filtered = filtered.filter(
      (session) => session.providerVenueId === settings.venueId,
    );
  }

  if (settings.upcomingOnly) {
    const today = new Date().toISOString().slice(0, 10);
    filtered = filtered.filter((session) => {
      const dates = session.schedule?.dates?.filter((d) => !d.cancelled) ?? [];
      if (dates.length === 0) return true;
      return dates.some((d) => d.date >= today);
    });
  }

  return filtered;
}
