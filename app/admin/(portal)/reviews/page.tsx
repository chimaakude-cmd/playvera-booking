"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import {
  formatDateAttended,
  formatReviewAge,
  getReviewSubmittedAt,
  getReviews,
  setAdminEligibilityOverride,
  updateReviewStatus,
  updateReviewTitle,
  type Review,
  type ReviewStatus,
} from "@/lib/reviews";

const STATUS_ACTIONS: Array<{ status: ReviewStatus; label: string }> = [
  { status: "published", label: "Publish" },
  { status: "hidden", label: "Hide" },
  { status: "reported", label: "Reported" },
  { status: "pending", label: "Pending" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  function load() {
    setReviews(
      [...getReviews()].sort(
        (a, b) =>
          new Date(getReviewSubmittedAt(b)).getTime() -
          new Date(getReviewSubmittedAt(a)).getTime(),
      ),
    );
  }

  useEffect(() => {
    load();
  }, []);

  function handleStatus(reviewId: string, status: ReviewStatus) {
    updateReviewStatus(reviewId, status);
    load();
  }

  function handleSaveTitle(reviewId: string) {
    updateReviewTitle(reviewId, titleDraft);
    setEditingTitleId(null);
    load();
  }

  function handleAdminOverride(review: Review) {
    setAdminEligibilityOverride(
      review.bookingId,
      review.childId ?? review.bookingId,
      review.activityId,
      true,
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews moderation"
        description="Manage verified reviews across all providers. Edit auto-titles, override eligibility, and handle reported reviews."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Total reviews</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{reviews.length}</p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Reported</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {reviews.filter((r) => r.status === "reported" || r.suspiciousFlag).length}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-violet-700">
            {reviews.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">AI not checked</p>
          <p className="mt-1 text-2xl font-bold text-zinc-700">
            {reviews.filter((r) => r.aiModerationStatus === "not_checked").length}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="space-y-3">
            <ReviewCard review={review} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
              <span>
                <span className="font-medium text-zinc-600">Reviewer:</span>{" "}
                {review.reviewerFirstName ?? "—"}
              </span>
              {review.childName ? (
                <span>
                  <span className="font-medium text-zinc-600">Child:</span>{" "}
                  {review.childName}
                </span>
              ) : null}
              {review.providerName ? (
                <span>
                  <span className="font-medium text-zinc-600">Provider:</span>{" "}
                  {review.providerName}
                </span>
              ) : null}
              <span>
                <span className="font-medium text-zinc-600">Booking:</span>{" "}
                {review.bookingId}
              </span>
              <span
                title={formatDateAttended(getReviewSubmittedAt(review))}
              >
                <span className="font-medium text-zinc-600">Submitted:</span>{" "}
                {formatReviewAge(getReviewSubmittedAt(review))} (
                {formatDateAttended(getReviewSubmittedAt(review))})
              </span>
              <span>
                <span className="font-medium text-zinc-600">Attended:</span>{" "}
                {formatDateAttended(review.dateAttended)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
              <span className="text-xs font-medium text-zinc-500">Auto-title:</span>
              {editingTitleId === review.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTitle(review.id)}
                    className="rounded-lg bg-violet-700 px-2.5 py-1 text-xs font-medium text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTitleId(null)}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-zinc-700">{review.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTitleId(review.id);
                      setTitleDraft(review.title);
                    }}
                    className="rounded-lg border border-violet-200 px-2 py-0.5 text-xs text-violet-800"
                  >
                    Edit title
                  </button>
                </>
              )}

              {review.suspiciousFlag ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  Suspicious
                </span>
              ) : null}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                AI: {review.aiModerationStatus ?? "not_checked"}
              </span>
              {review.duplicateDetected ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  Duplicate
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => handleAdminOverride(review)}
                className="rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-100"
              >
                Eligibility override
              </button>

              <span className="ml-auto flex flex-wrap gap-1">
                {STATUS_ACTIONS.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => handleStatus(review.id, action.status)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      review.status === action.status
                        ? "bg-violet-700 text-white"
                        : "border border-violet-200 text-violet-800 hover:bg-violet-100"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
