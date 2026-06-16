"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import {
  addReviewResponse,
  getReviewResponses,
  getReviewInsights,
  getReviewSubmittedAt,
  getPublishedReviewsForProvider,
  reportReview,
  type Review,
} from "@/lib/reviews";
import { getClubProfile } from "@/lib/club-profile";

export default function ClubReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const profile = getClubProfile();

  function loadReviews() {
    const providerId = getClubProfile()?.providerId ?? "local-provider";
    setReviews(
      getPublishedReviewsForProvider(providerId).sort(
        (a, b) =>
          new Date(getReviewSubmittedAt(b)).getTime() -
          new Date(getReviewSubmittedAt(a)).getTime(),
      ),
    );
    setLoading(false);
  }

  useEffect(() => {
    loadReviews();
  }, []);

  function handleRespond(reviewId: string) {
    if (!responseText.trim() || !profile) return;
    addReviewResponse(
      reviewId,
      getClubProfile()?.providerId ?? "local-provider",
      responseText.trim(),
      profile.clubName,
    );
    setRespondingId(null);
    setResponseText("");
    loadReviews();
  }

  function handleReport(reviewId: string) {
    reportReview(reviewId, profile?.clubName ?? "Club", "Inappropriate content");
    loadReviews();
  }

  if (loading) {
    return <LoadingState message="Loading reviews..." />;
  }

  const insights = getReviewInsights(profile?.providerId ?? "local-provider");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Reviews"
        description="Verified reviews from parents who booked and attended your sessions."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Average score</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {insights.averageRating > 0 ? insights.averageRating.toFixed(1) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Response rate</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">
            {insights.responseRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Conversion</p>
          <p className="mt-1 text-2xl font-bold text-violet-700">
            {insights.conversionPercent}%
          </p>
        </div>
      </div>

      {insights.recentKeywords.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {insights.recentKeywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {keyword}
            </span>
          ))}
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">No reviews submitted yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Published reviews appear here after admin verification.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const responses = getReviewResponses(review.id);

            return (
              <div key={review.id} className="space-y-3">
                <ReviewCard review={review} response={responses[0]} />
                <div className="flex flex-wrap gap-2 pl-1">
                  {responses.length === 0 ? (
                    respondingId === review.id ? (
                      <div className="w-full space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          placeholder="Write a public response..."
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespond(review.id)}
                            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Post response
                          </button>
                          <button
                            type="button"
                            onClick={() => setRespondingId(null)}
                            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRespondingId(review.id)}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Respond publicly
                      </button>
                    )
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleReport(review.id)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50"
                  >
                    Report to admin
                  </button>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">
                    {review.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
