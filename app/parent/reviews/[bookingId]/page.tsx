"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { getBookingById } from "@/lib/bookings";
import {
  canSubmitReview,
  formatDateAttended,
  formatSessionAttended,
  submitReview,
  type ReviewInput,
} from "@/lib/reviews";
import { getSessionById } from "@/lib/sessions";

export default function ParentReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ineligibleReason, setIneligibleReason] = useState<string | null>(null);
  const [sessionAttended, setSessionAttended] = useState("Verified activity");
  const [dateAttended, setDateAttended] = useState("");

  useEffect(() => {
    async function load() {
      const resolved = await params;
      setBookingId(resolved.bookingId);

      const booking = getBookingById(resolved.bookingId);
      if (booking) {
        const session = getSessionById(booking.sessionId);
        setSessionAttended(
          formatSessionAttended(
            session?.sessionTitle ?? booking.sessionTitle,
            session?.venue?.venueName,
          ),
        );
        setDateAttended(
          formatDateAttended(
            booking.day ? booking.day.slice(0, 10) : new Date().toISOString().slice(0, 10),
          ),
        );
      }

      const eligibility = canSubmitReview(resolved.bookingId);
      if (!eligibility.eligible) {
        setIneligibleReason(eligibility.reason ?? "Not eligible to review.");
      }
    }

    void load();
  }, [params]);

  function handleSubmit(input: ReviewInput) {
    try {
      submitReview(input);
      setSubmitted(true);
    } catch (error) {
      setIneligibleReason(
        error instanceof Error ? error.message : "Could not submit review.",
      );
    }
  }

  if (!bookingId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="max-w-md rounded-3xl border border-teal-200 bg-white p-8 shadow-sm">
          <p className="text-4xl" aria-hidden>
            ✓
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
            Thank you!
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Your verified review has been submitted. It will appear on the club
            profile after admin verification.
          </p>
          <Link
            href="/parent/bookings"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  if (ineligibleReason) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">
            Unable to leave a review
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{ineligibleReason}</p>
          <Link
            href="/parent/bookings"
            className="mt-6 inline-flex rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-800"
          >
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Verified review
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Rate your experience
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Takes less than a minute
          </p>

          <div className="mt-8">
            <ReviewForm
              bookingId={bookingId}
              sessionAttended={sessionAttended}
              dateAttended={dateAttended}
              onSubmit={handleSubmit}
              minimal
            />
          </div>
        </div>
      </div>
    </div>
  );
}
