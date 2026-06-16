"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import {
  formatDateAttended,
  formatReviewAge,
  getBookingProof,
  getReviewSubmittedAt,
  getReviews,
  hideReview,
  markReviewReported,
  rejectReview,
  requestReviewMoreInfo,
  REVIEW_STATUS_LABELS,
  setAdminEligibilityOverride,
  updateReviewTitle,
  verifyAndPublishReview,
  type BookingProof,
  type Review,
  type ReviewStatus,
} from "@/lib/reviews";

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    pending_verification: "bg-amber-50 text-amber-800 ring-amber-200",
    published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    hidden: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    reported: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {REVIEW_STATUS_LABELS[status]}
    </span>
  );
}

function BookingProofPanel({ proof }: { proof: BookingProof }) {
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
        Booking proof
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Booking ID</dt>
          <dd className="font-medium text-zinc-900">{proof.bookingId}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Session name</dt>
          <dd className="font-medium text-zinc-900">{proof.sessionName}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Provider</dt>
          <dd className="font-medium text-zinc-900">{proof.provider}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Date attended</dt>
          <dd className="font-medium text-zinc-900">
            {formatDateAttended(proof.dateAttended)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Payment status</dt>
          <dd className="font-medium text-zinc-900">{proof.paymentStatus}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Attendance status</dt>
          <dd className="font-medium text-zinc-900">{proof.attendanceStatus}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-500">Reviewer email</dt>
          <dd className="font-medium text-zinc-900">{proof.reviewerEmail}</dd>
        </div>
      </dl>
    </div>
  );
}

export function AdminReviewsDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [proofReviewId, setProofReviewId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  function handleAction(label: string, action: () => void) {
    action();
    setActionMessage(label);
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
    setActionMessage("Eligibility override saved.");
  }

  const proofReview = proofReviewId
    ? reviews.find((review) => review.id === proofReviewId)
    : null;
  const proof = proofReview ? getBookingProof(proofReview) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews moderation"
        description="Verify authentic reviews before they appear publicly. All new submissions start as pending verification."
      />

      {actionMessage ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Total reviews</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{reviews.length}</p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Pending verification</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {reviews.filter((r) => r.status === "pending_verification").length}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Published</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {reviews.filter((r) => r.status === "published").length}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Reported</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {reviews.filter((r) => r.status === "reported" || r.suspiciousFlag).length}
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">No reviews submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={review.status} />
                {review.infoRequestedAt ? (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                    Info requested
                  </span>
                ) : null}
              </div>

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
                <span title={formatDateAttended(getReviewSubmittedAt(review))}>
                  <span className="font-medium text-zinc-600">Submitted:</span>{" "}
                  {formatReviewAge(getReviewSubmittedAt(review))} (
                  {formatDateAttended(getReviewSubmittedAt(review))})
                </span>
                <span>
                  <span className="font-medium text-zinc-600">Attended:</span>{" "}
                  {formatDateAttended(review.dateAttended)}
                </span>
              </div>

              {proofReviewId === review.id && proof ? (
                <BookingProofPanel proof={proof} />
              ) : null}

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

                <div className="ml-auto flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleAction("Review verified and published.", () =>
                        verifyAndPublishReview(review.id),
                      )
                    }
                    className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-800"
                  >
                    Verify authentic &amp; publish
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAction("Review rejected.", () => rejectReview(review.id))
                    }
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAction("Review hidden.", () => hideReview(review.id))
                    }
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAction("Review marked as reported.", () =>
                        markReviewReported(review.id),
                      )
                    }
                    className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Mark as reported
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAction("More information requested from reviewer.", () =>
                        requestReviewMoreInfo(review.id),
                      )
                    }
                    className="rounded-lg border border-sky-200 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                  >
                    Request more info
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProofReviewId((current) =>
                        current === review.id ? null : review.id,
                      )
                    }
                    className="rounded-lg border border-teal-200 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
                  >
                    {proofReviewId === review.id
                      ? "Hide booking proof"
                      : "View booking proof"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminOverride(review)}
                    className="rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-100"
                  >
                    Eligibility override
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
