"use client";

import type { BookingQuestionConfig } from "@/lib/booking-questions";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import type { ClubSession } from "@/lib/sessions";
import { formatDay, formatTimeRange } from "@/lib/sessions";

type BookingReviewStepProps = {
  session: ClubSession;
  details: BookingDetailsForm;
  allQuestions: BookingQuestionConfig[];
  questionValues: Record<string, string | boolean>;
  waitlist?: boolean;
};

export function BookingReviewStep({
  session,
  details,
  allQuestions,
  questionValues,
  waitlist = false,
}: BookingReviewStepProps) {
  const answeredQuestions = allQuestions.filter((question) => {
    const value = questionValues[question.key];
    return value !== undefined && value !== "";
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Review</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Check everything looks correct before{" "}
          {waitlist ? "joining the waitlist" : "continuing to payment"}.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Session</h3>
        <p className="mt-1 text-sm text-zinc-700">{session.sessionTitle}</p>
        <p className="text-xs text-zinc-500">
          {formatDay(session.day)} ·{" "}
          {formatTimeRange(session.startTime, session.endTime)}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Parent
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900">
            {details.parentName}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Email
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900">
            {details.email}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Child
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900">
            {details.childName} (age {details.childAge})
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Emergency contact
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900">
            {[details.emergencyContactName, details.emergencyContactPhone]
              .filter(Boolean)
              .join(" · ") || "—"}
          </dd>
        </div>
      </dl>

      {answeredQuestions.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Your answers</h3>
          <ul className="mt-3 space-y-2">
            {answeredQuestions.map((question) => (
              <li
                key={question.key}
                className="rounded-lg border border-zinc-100 bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-700">
                  {question.label}:{" "}
                </span>
                <span className="text-zinc-900">
                  {String(questionValues[question.key])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {waitlist ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
          You will not be charged today. If a place becomes available, we will
          invite you to complete payment.
        </div>
      ) : null}
    </div>
  );
}
