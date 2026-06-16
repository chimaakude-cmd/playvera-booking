"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Star } from "lucide-react";
import type { ClubSession } from "@/lib/sessions";
import {
  formatDay,
  formatSessionLocation,
  formatTimeRange,
} from "@/lib/sessions";
import { getSessionGalleryImageUrls, getSessionImages } from "@/lib/session-images";
import { SessionImage } from "@/components/sessions/SessionImage";
import { HOME_BUTTON } from "@/components/home/shared";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import {
  getDemoRating,
  getDemoReviewCount,
  getFromPriceLabel,
  getProviderName,
} from "@/lib/discovery/session-display";
import { LoadingState } from "@/components/club/LoadingState";

const SessionsMap = dynamic(
  () => import("@/components/sessions/SessionsMap").then((m) => m.SessionsMap),
  { ssr: false, loading: () => <LoadingState message="Loading map…" /> },
);

type SessionExpandPanelProps = {
  session: ClubSession;
};

export function SessionExpandPanel({ session }: SessionExpandPanelProps) {
  const { mainImageId, galleryImageIds } = getSessionImages(session);
  const galleryUrls = getSessionGalleryImageUrls(session);
  const rating = getDemoRating(session);
  const reviewCount = getDemoReviewCount(session);

  const description =
    session.description?.trim() ||
    `Join ${session.sessionTitle} — a ${session.activityType.replace(/_/g, " ")} session for ${session.ageRange}. Sessions run ${formatDay(session.day)} from ${formatTimeRange(session.startTime, session.endTime)}.`;

  const demoReviews = [
    {
      name: "Sarah M.",
      text: "My child loved it — brilliant coaches and well organised.",
      rating: 5,
    },
    {
      name: "James T.",
      text: "Easy booking and great communication from the provider.",
      rating: 5,
    },
  ];

  return (
    <div className="border-t border-slate-100 bg-[#F8FAFC] px-4 py-5 sm:px-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">About this activity</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Schedule</h3>
            <dl className="mt-1.5 grid gap-1 text-sm text-slate-600">
              <div className="flex gap-2">
                <dt className="font-medium text-slate-500">Day:</dt>
                <dd>{formatDay(session.day)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-slate-500">Time:</dt>
                <dd>{formatTimeRange(session.startTime, session.endTime)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-slate-500">Ages:</dt>
                <dd>{session.ageRange}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-slate-500">Price:</dt>
                <dd>{getFromPriceLabel(session)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Coach & provider</h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Delivered by <strong>{getProviderName(session)}</strong> at{" "}
              {session.venue?.venueName || formatSessionLocation(session)}.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Reviews ({reviewCount})
            </h3>
            <div className="mt-2 space-y-2">
              {demoReviews.map((review) => (
                <div
                  key={review.name}
                  className={`border border-slate-200 bg-white p-3 ${HOME_BUTTON}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0F172A]">
                      {review.name}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" aria-hidden />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{review.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Average rating {rating.toFixed(1)} from {reviewCount} reviews
            </p>
          </div>

          {(galleryImageIds.length > 0 || galleryUrls.length > 0) ? (
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Photos</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[mainImageId, ...galleryImageIds]
                  .filter((id): id is string => Boolean(id))
                  .slice(0, 3)
                  .map((id) => (
                    <div
                      key={id}
                      className={`relative aspect-[4/3] overflow-hidden ${HOME_BUTTON}`}
                    >
                      <SessionImage imageId={id} alt={session.sessionTitle} />
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#0F172A]">Location</h3>
          <p className="mt-1 text-sm text-slate-600">
            {formatSessionLocation(session)}
          </p>
          <div className={`mt-2 h-48 overflow-hidden border border-slate-200 ${HOME_BUTTON}`}>
            <SessionsMap
              sessions={[session]}
              activeSessionId={session.id}
              focusSessionId={session.id}
              onSessionSelect={() => {}}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/book/${session.id}`}
          className={`inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${HOME_BUTTON}`}
          style={{ backgroundColor: ACTIVORA_ACTION }}
        >
          Book this session
        </Link>
      </div>
    </div>
  );
}
