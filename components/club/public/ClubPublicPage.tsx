"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClubProfile, ClubProfileLocation } from "@/lib/club-profile";
import {
  DEMO_CLUB_FAQ,
  formatClubAddress,
  getMainClubLocation,
  verificationStatusLabels,
} from "@/lib/club-profile";
import {
  ClubSession,
  formatDay,
  formatSessionLocation,
  formatTimeRange,
  getCapacitySummary,
} from "@/lib/sessions";
import {
  getActivityRatingSummary,
  getPublishedReviewsForProvider,
  getProviderRatingSummary,
  getReviewResponses,
} from "@/lib/reviews";
import { ReviewCard, StarRatingSummary } from "@/components/reviews/ReviewCard";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { ClubConnectBar, ClubContactMethods } from "./ClubConnectBar";
import { PoweredByActivoraFooter } from "@/components/PoweredByActivoraFooter";

type ClubPublicPageProps = {
  profile: ClubProfile;
  sessions: ClubSession[];
};

function groupSessionsByVenue(
  sessions: ClubSession[],
  locations: ClubProfileLocation[],
) {
  const groups = new Map<string, { venue: string; sessions: ClubSession[] }>();

  for (const session of sessions) {
    const venueLabel = formatSessionLocation(session);
    const match =
      locations.find((location) => venueLabel.includes(location.venueName)) ??
      locations.find((location) => location.isMain) ??
      locations[0];
    const key = match?.id ?? venueLabel;

    const existing = groups.get(key);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.set(key, {
        venue: match?.venueName || venueLabel || "Activities",
        sessions: [session],
      });
    }
  }

  return Array.from(groups.values());
}

function ActivityCard({ session }: { session: ClubSession }) {
  const fillPercent =
    session.capacity > 0
      ? Math.min(100, Math.round((session.bookings / session.capacity) * 100))
      : 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[16/10] bg-gradient-to-br from-zinc-100 via-zinc-50 to-teal-50" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-semibold text-zinc-900">
            {session.sessionTitle}
          </h4>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
            {session.ageRange || "All ages"}
          </span>
        </div>
        <p className="text-sm text-zinc-600">
          {formatDay(session.day)} ·{" "}
          {formatTimeRange(session.startTime, session.endTime)}
        </p>
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
        <Link
          href={`/book/${session.id}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Book now
        </Link>
      </div>
    </article>
  );
}

export function ClubPublicPage({ profile, sessions }: ClubPublicPageProps) {
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const mainLocation = getMainClubLocation(profile);
  const venueGroups = useMemo(
    () => groupSessionsByVenue(sessions, profile.locations),
    [sessions, profile.locations],
  );

  const publishedReviews = useMemo(
    () => getPublishedReviewsForProvider(profile.providerId),
    [profile.providerId],
  );
  const providerRating = useMemo(
    () => getProviderRatingSummary(profile.providerId, publishedReviews),
    [profile.providerId, publishedReviews],
  );

  const primary = profile.branding.primaryColor;
  const secondary = profile.branding.secondaryColor;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-zinc-700">
            ← Back to {profile.clubName}
          </Link>
          <div className="flex gap-2">
            <ShareClubButton
              clubName={profile.clubName}
              slug={profile.publicSlug}
              providerId={profile.providerId}
              logoUrl={profile.logoUrl}
              primaryColor={primary}
              secondaryColor={secondary}
            />
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Follow club
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="h-56 sm:h-72"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          }}
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="-mt-14 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-lg sm:-mt-16 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-3xl font-bold text-zinc-500 ring-4 ring-white">
                {profile.clubName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {profile.clubName}
                  </h1>
                  {profile.verificationStatus !== "unverified" ? (
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                      {verificationStatusLabels[profile.verificationStatus]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-lg text-zinc-600">{profile.tagline}</p>
                <div className="mt-3">
                  <StarRatingSummary
                    averageRating={providerRating.averageRating}
                    reviewCount={providerRating.reviewCount}
                  />
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                  {profile.shortDescription}
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: primary }}
              >
                Book now
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">About</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              {profile.longDescription}
            </p>
            <p className="mt-5 text-sm font-semibold text-zinc-900">
              What makes us different
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-600">
              {profile.uniqueSellingPoints}
            </p>
            {profile.customerView.showAgeRanges ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.ageRanges.map((range) => (
                  <span
                    key={range}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {range}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {profile.customerView.showMap && mainLocation ? (
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Locations</h2>
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-teal-50 to-violet-50 p-6">
                <p className="text-sm font-semibold text-zinc-900">
                  {mainLocation.venueName}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatClubAddress(mainLocation)}
                </p>
                <p className="mt-3 text-xs text-zinc-500">
                  Map preview placeholder · serves {mainLocation.radiusMiles} miles
                </p>
              </div>
              {profile.locations.slice(1).map((location) => (
                <p key={location.id} className="mt-3 text-sm text-zinc-600">
                  {location.venueName} · {location.townCity}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Activities</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Browse sessions grouped by venue
              </p>
            </div>
            <Link
              href="/sessions"
              className="text-sm font-semibold text-teal-700"
            >
              View all sessions
            </Link>
          </div>

          {venueGroups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-700">
                No activities published yet
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Sessions from this club will appear here once live.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {venueGroups.map((group, index) => {
                const isOpen =
                  expandedVenue === null
                    ? index === 0
                    : expandedVenue === group.venue;

                return (
                  <div
                    key={group.venue}
                    className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedVenue(isOpen ? null : group.venue)
                      }
                      className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
                    >
                      <div>
                        <p className="text-base font-semibold text-zinc-900">
                          {group.venue}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {group.sessions.length} activit
                          {group.sessions.length === 1 ? "y" : "ies"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-teal-700">
                        {isOpen ? "Hide" : "Show"}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="grid gap-4 border-t border-zinc-100 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
                        {group.sessions.map((session) => (
                          <ActivityCard key={session.id} session={session} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {profile.customerView.showTestimonials ? (
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Verified reviews</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  From parents who booked and attended
                </p>
              </div>
              <StarRatingSummary
                averageRating={providerRating.averageRating}
                reviewCount={providerRating.reviewCount}
              />
            </div>
            {publishedReviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
                <p className="text-sm font-medium text-zinc-700">
                  No verified reviews yet
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {publishedReviews.map((review) => {
                  const activityRating = getActivityRatingSummary(
                    review.activityId,
                    publishedReviews,
                  );

                  return (
                    <div key={review.id} className="space-y-2">
                      <ReviewCard
                        review={review}
                        response={getReviewResponses(review.id)[0]}
                      />
                      {activityRating.reviewCount > 0 ? (
                        <p className="px-1 text-xs text-zinc-500">
                          Activity rating: {activityRating.averageRating.toFixed(1)} (
                          {activityRating.reviewCount} review
                          {activityRating.reviewCount === 1 ? "" : "s"})
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {profile.customerView.showGallery ? (
          <section>
            <h2 className="text-2xl font-semibold">Gallery</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.mediaGallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-zinc-100 to-teal-50" />
                  <p className="mt-3 text-sm font-medium text-zinc-800">
                    {item.caption || item.type}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <ClubContactMethods contact={profile.contact} />

        {profile.customerView.showSocialLinks ? (
          <ClubConnectBar
            contact={profile.contact}
            socialLinks={profile.socialLinks}
            showSocialLinks
          />
        ) : null}

        <section>
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-6 space-y-3">
            {DEMO_CLUB_FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-900">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <PoweredByActivoraFooter />
    </div>
  );
}
