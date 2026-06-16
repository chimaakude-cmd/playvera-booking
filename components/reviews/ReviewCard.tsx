"use client";

import { useState } from "react";
import type { Review, ReviewResponse } from "@/lib/reviews";
import { incrementHelpfulCount } from "@/lib/reviews";
import {
  formatReviewAge,
  formatSessionAttended,
  getReviewAgeTooltip,
  getReviewSubmittedAt,
} from "@/lib/reviews/display";
import { renderStars } from "@/lib/reviews/ratings";

type ReviewCardProps = {
  review: Review;
  response?: ReviewResponse;
  onHelpful?: (reviewId: string) => void;
};

export function VerifiedBookingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800">
      Verified booking
    </span>
  );
}

export function ReviewCard({
  review,
  response,
  onHelpful,
}: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [markedHelpful, setMarkedHelpful] = useState(false);

  function handleHelpful() {
    if (markedHelpful) return;
    const updated = incrementHelpfulCount(review.id);
    if (updated) {
      setHelpfulCount(updated.helpfulCount);
      setMarkedHelpful(true);
      onHelpful?.(review.id);
    }
  }

  const sessionAttended = formatSessionAttended(
    review.sessionTitle,
    review.venueName,
  );
  const reviewSubmittedAt = getReviewSubmittedAt(review);
  const reviewAge = formatReviewAge(reviewSubmittedAt);
  const reviewAgeTooltip = getReviewAgeTooltip(reviewSubmittedAt);

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg text-amber-400" aria-label={`${review.rating} stars`}>
            {renderStars(review.rating)}
          </span>
          <span className="text-sm font-semibold text-zinc-900">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-sm text-zinc-600">
        <div>
          <dt className="font-medium text-zinc-800">Session attended:</dt>
          <dd className="mt-0.5 line-clamp-2 text-zinc-700">{sessionAttended}</dd>
        </div>
        <div>
          <dd
            className="mt-0.5 text-zinc-500"
            title={reviewAgeTooltip}
          >
            {reviewAge}
          </dd>
        </div>
      </dl>

      {review.verified ? (
        <div className="mt-4">
          <VerifiedBookingBadge />
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-7 text-zinc-700">{review.comment}</p>

      <footer className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={markedHelpful}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            markedHelpful
              ? "border-teal-200 bg-teal-50 text-teal-700"
              : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Helpful 👍{helpfulCount > 0 ? ` ${helpfulCount}` : ""}
        </button>

        <span
          className={
            review.recommend ? "text-teal-700" : "text-zinc-500"
          }
        >
          {review.recommend ? "Would recommend ✓" : "Would not recommend"}
        </span>
      </footer>

      {response ? (
        <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Provider response
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">{response.body}</p>
        </div>
      ) : null}
    </article>
  );
}

export function StarRatingSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number;
  reviewCount: number;
}) {
  if (reviewCount === 0) {
    return (
      <p className="text-sm text-zinc-500">No reviews submitted yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-2xl font-bold text-zinc-900">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-lg text-amber-400">{renderStars(averageRating)}</span>
      <span className="text-sm text-zinc-500">
        {reviewCount} verified review{reviewCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
