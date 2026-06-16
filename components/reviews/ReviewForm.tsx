"use client";

import { useState } from "react";
import type { ReviewInput } from "@/lib/reviews";

type ReviewFormProps = {
  bookingId: string;
  sessionAttended: string;
  dateAttended: string;
  onSubmit: (input: ReviewInput) => void;
  onCancel?: () => void;
  minimal?: boolean;
};

export function ReviewForm({
  bookingId,
  sessionAttended,
  dateAttended,
  onSubmit,
  onCancel,
  minimal = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }

    onSubmit({
      bookingId,
      rating,
      comment: comment.trim(),
      recommend,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <dl className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm">
        <div>
          <dt className="font-medium text-zinc-700">You attended:</dt>
          <dd className="mt-0.5 line-clamp-2 font-medium text-zinc-900">
            {sessionAttended}
          </dd>
        </div>
        <div className="mt-3">
          <dt className="font-medium text-zinc-700">Date:</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{dateAttended}</dd>
        </div>
      </dl>

      <div>
        <p className="text-sm font-medium text-zinc-700">
          {minimal ? "Rate your experience" : "Your rating"}
        </p>
        <div className={`mt-2 flex gap-1 ${minimal ? "justify-center" : ""}`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`transition-colors ${
                minimal ? "text-4xl sm:text-5xl" : "text-2xl"
              } ${star <= rating ? "text-amber-400" : "text-zinc-300"}`}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="text-sm font-medium text-zinc-700"
        >
          {minimal ? "Comment (optional)" : "Your feedback"}
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={minimal ? 3 : 4}
          className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm"
          placeholder={
            minimal
              ? "What stood out about the session?"
              : "Tell other parents about your experience..."
          }
        />
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-700">Would you recommend?</p>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => setRecommend(true)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              recommend
                ? "bg-teal-600 text-white"
                : "border border-zinc-200 text-zinc-600"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setRecommend(false)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              !recommend
                ? "bg-zinc-800 text-white"
                : "border border-zinc-200 text-zinc-600"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Submit review
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
