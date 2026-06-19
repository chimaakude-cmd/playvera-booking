"use client";

import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";
import { getPublishedReviews } from "@/lib/reviews/storage";

type DiscoverySocialProofBarProps = {
  location: string;
  sessionCount: number;
};

function getPlatformAverageRating(): { averageRating: number; reviewCount: number } {
  const reviews = getPublishedReviews();
  if (reviews.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

export function DiscoverySocialProofBar({
  location,
  sessionCount,
}: DiscoverySocialProofBarProps) {
  const locationLabel = location.trim() || "you";
  const { averageRating, reviewCount } = getPlatformAverageRating();

  return (
    <div className="my-4 px-4 sm:px-6">
      <div
        className={`discovery-social-proof mx-auto max-w-[1400px] ${DISCOVERY_RADIUS.card}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-xs font-semibold text-[#0F172A] sm:gap-x-8 sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>🔥</span>
            84 parents booked this week
          </span>
          {reviewCount > 0 ? (
            <>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden>⭐</span>
                {averageRating.toFixed(1)} avg rating
              </span>
            </>
          ) : null}
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>📍</span>
            {sessionCount} sessions near {locationLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
