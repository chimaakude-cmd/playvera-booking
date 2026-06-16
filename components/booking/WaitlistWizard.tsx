"use client";

import { useEffect, useMemo, useState } from "react";
import { FlowProgressBar } from "@/components/booking/FlowProgressBar";
import { AccessChoiceStep } from "@/components/booking/steps/AccessChoiceStep";
import { BookingDetailsStep } from "@/components/booking/steps/BookingDetailsStep";
import { BookingReviewStep } from "@/components/booking/steps/BookingReviewStep";
import { WaitlistConfirmationStep } from "@/components/booking/steps/WaitlistConfirmationStep";
import { SessionImage } from "@/components/sessions/SessionImage";
import { PoweredByActivoraFooter } from "@/components/PoweredByActivoraFooter";
import { Logo } from "@/components/branding";
import { readAuthSession } from "@/lib/auth/session";
import { WAITLIST_FLOW_STEPS } from "@/lib/booking-flow/constants";
import {
  clearBookingDraft,
  createInitialDraft,
  loadBookingDraft,
  saveBookingDraft,
} from "@/lib/booking-flow/draft-storage";
import { validateRequiredQuestions } from "@/lib/booking-flow/questions";
import { syncDetailsToChildProfile } from "@/lib/booking-flow/sync-child";
import type { BookingAccessMode, BookingFlowStep } from "@/lib/booking-flow/types";
import { emptyBookingDetails } from "@/lib/booking-flow/types";
import { getSessionBookingQuestions } from "@/lib/booking-questions";
import type { ClubSession } from "@/lib/sessions";
import { formatDay, formatTimeRange } from "@/lib/sessions";
import { getSessionImages } from "@/lib/session-images";
import {
  upsertWaitlistEntriesFromServer,
} from "@/lib/waitlist/storage";
import type { WaitlistEntry } from "@/lib/waitlist/types";

type WaitlistWizardProps = {
  session: ClubSession;
};

function resolveAccessMode(mode: BookingAccessMode): "guest" | "parent" {
  return mode === "guest" ? "guest" : "parent";
}

export function WaitlistWizard({ session }: WaitlistWizardProps) {
  const bookingQuestions = useMemo(
    () => getSessionBookingQuestions(session),
    [session],
  );
  const { mainImageId } = getSessionImages(session);

  const [step, setStep] = useState<BookingFlowStep>(1);
  const [accessMode, setAccessMode] = useState<BookingAccessMode>("guest");
  const [details, setDetails] = useState(emptyBookingDetails);
  const [questionValues, setQuestionValues] = useState<
    Record<string, string | boolean>
  >({});
  const [detailErrors, setDetailErrors] = useState<
    Partial<Record<keyof typeof details, string>>
  >({});
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedEntry, setConfirmedEntry] = useState<WaitlistEntry | null>(
    null,
  );

  useEffect(() => {
    const draft = loadBookingDraft(session.id);
    if (draft) {
      setStep(draft.currentStep);
      setAccessMode(draft.accessMode);
      setDetails(draft.details);
      setQuestionValues(draft.questionValues);
    } else {
      saveBookingDraft(createInitialDraft(session.id));
    }
  }, [session.id]);

  function persistDraft(nextStep: BookingFlowStep) {
    saveBookingDraft({
      sessionId: session.id,
      accessMode,
      details,
      questionValues,
      currentStep: nextStep,
    });
  }

  function validateDetails(): boolean {
    const nextErrors: Partial<Record<keyof typeof details, string>> = {};
    const required: Array<keyof typeof details> = [
      "parentName",
      "email",
      "childName",
      "childAge",
      "emergencyContactName",
      "emergencyContactPhone",
    ];

    required.forEach((field) => {
      if (!String(details[field] ?? "").trim()) {
        nextErrors[field] = "This field is required";
      }
    });

    if (details.childAge.trim() && Number.isNaN(Number(details.childAge))) {
      nextErrors.childAge = "Enter a valid age";
    }

    const nextQuestionErrors = validateRequiredQuestions(
      bookingQuestions,
      questionValues,
    );

    const hasErrors =
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextQuestionErrors).length > 0;

    setDetailErrors(nextErrors);
    setQuestionErrors(nextQuestionErrors);
    setFormError(hasErrors ? "Please fill in all required fields." : "");

    return !hasErrors;
  }

  async function submitWaitlist() {
    if (!validateDetails()) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    setFormError("");

    const authSession = readAuthSession();
    const access = resolveAccessMode(accessMode);

    try {
      const response = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          details,
          sessionQuestions: bookingQuestions,
          questionValues,
          parentId: authSession?.role === "parent" ? authSession.id : null,
          accessMode: access,
        }),
      });

      const data = (await response.json()) as {
        entry?: WaitlistEntry;
        error?: string;
      };

      if (!response.ok || !data.entry) {
        setFormError(data.error ?? "Could not join the waitlist. Try again.");
        setSubmitting(false);
        return;
      }

      if (details.childId && access === "parent") {
        syncDetailsToChildProfile(details.childId, details);
      }

      upsertWaitlistEntriesFromServer([data.entry]);
      clearBookingDraft(session.id);
      setConfirmedEntry(data.entry);
      setStep(4);
    } catch {
      setFormError("Could not join the waitlist. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function goToStep(nextStep: BookingFlowStep) {
    persistDraft(nextStep);
    setStep(nextStep);
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-100">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="desktop" href="/" />
          <a
            href="/sessions"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Back to Sessions
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Join Waitlist
        </h1>
        <p className="mt-2 text-zinc-500">
          This session is sold out. Join the queue — no payment until invited.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="relative aspect-[16/9] bg-zinc-100">
            <SessionImage
              imageId={mainImageId}
              alt={session.sessionTitle}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-5">
            <h2 className="font-semibold text-zinc-900">{session.sessionTitle}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {formatDay(session.day)} ·{" "}
              {formatTimeRange(session.startTime, session.endTime)}
            </p>
            <span className="mt-3 inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
              Sold out
            </span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          {step < 4 ? (
            <FlowProgressBar steps={WAITLIST_FLOW_STEPS} currentStep={step} />
          ) : null}

          {formError ? (
            <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          ) : null}

          {step === 1 ? (
            <AccessChoiceStep
              sessionId={session.id}
              waitlist
              accessMode={accessMode}
              onSelect={setAccessMode}
              onContinue={() => goToStep(2)}
            />
          ) : null}

          {step === 2 ? (
            <>
              <BookingDetailsStep
                details={details}
                allQuestions={bookingQuestions}
                questionValues={questionValues}
                questionErrors={questionErrors}
                detailErrors={detailErrors}
                onDetailsChange={setDetails}
                onQuestionChange={(key, value) => {
                  setQuestionValues((current) => ({ ...current, [key]: value }));
                  setQuestionErrors((current) => ({ ...current, [key]: "" }));
                }}
              />
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateDetails()) {
                      goToStep(3);
                    }
                  }}
                  className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  Continue to review
                </button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <BookingReviewStep
                session={session}
                details={details}
                allQuestions={bookingQuestions}
                questionValues={questionValues}
                waitlist
              />
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitWaitlist}
                  className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Joining…" : "Join waitlist"}
                </button>
              </div>
            </>
          ) : null}

          {step === 4 && confirmedEntry ? (
            <WaitlistConfirmationStep
              entry={confirmedEntry}
              sessionTitle={session.sessionTitle}
            />
          ) : null}
        </div>
      </main>
      <PoweredByActivoraFooter />
    </div>
  );
}
