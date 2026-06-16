"use client";

import { useState } from "react";
import { ReviewForm } from "./ReviewForm";
import {
  canReviewBooking,
  formatDateAttended,
  formatSessionAttended,
  getDateAttendedForBooking,
  getSessionTitleForBooking,
  getVenueNameForBooking,
  submitReview,
  type ReviewInput,
} from "@/lib/reviews";

type ReviewPromptProps = {
  bookingId: string;
};

export function ReviewPrompt({ bookingId }: ReviewPromptProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionAttended = formatSessionAttended(
    getSessionTitleForBooking(bookingId),
    getVenueNameForBooking(bookingId),
  );
  const dateAttended = formatDateAttended(getDateAttendedForBooking(bookingId));

  if (!canReviewBooking(bookingId)) {
    return null;
  }

  function handleSubmit(input: ReviewInput) {
    try {
      submitReview(input);
      setSubmitted(true);
      setOpen(false);
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit review.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        Thank you! Your review has been submitted and will appear after admin
        verification.
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
        <p className="text-sm font-semibold text-violet-900">
          Please review your experience
        </p>
        <p className="mt-1 text-sm text-violet-700">
          You attended {sessionAttended}. Share feedback to help other parents.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
        >
          Leave a review
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">Leave a review</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Only customers with completed bookings can leave reviews.
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4">
        <ReviewForm
          bookingId={bookingId}
          sessionAttended={sessionAttended}
          dateAttended={dateAttended}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          minimal
        />
      </div>
    </div>
  );
}
