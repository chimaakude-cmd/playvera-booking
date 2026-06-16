"use client";

import { useEffect, useMemo, useState } from "react";
import { SessionImage } from "@/components/sessions/SessionImage";
import { getCurrentUser } from "@/lib/auth";
import {
  clearBookingDraft,
  createInitialDraft,
  loadBookingDraft,
  saveBookingDraft,
} from "@/lib/booking-flow/draft-storage";
import { getSessionSpecificQuestions } from "@/lib/booking-flow/questions";
import type {
  BookingFlowDraft,
  BookingFlowStep,
} from "@/lib/booking-flow/types";
import { getSessionBookingQuestions } from "@/lib/booking-questions";
import {
  ClubSession,
  formatDay,
  formatTimeRange,
} from "@/lib/sessions";
import { getSessionImages } from "@/lib/session-images";
import { BookingAccessStep } from "./BookingAccessStep";
import { BookingCheckoutStep } from "./BookingCheckoutStep";
import { BookingGuestDetailsStep } from "./BookingGuestDetailsStep";
import { BookingLoggedInDetailsStep } from "./BookingLoggedInDetailsStep";
import { BookingProgressBar } from "./BookingProgressBar";
import { BookingQuestionsStep } from "./BookingQuestionsStep";

type BookingWizardProps = {
  session: ClubSession;
};

export function BookingWizard({ session }: BookingWizardProps) {
  const [draft, setDraft] = useState<BookingFlowDraft>(() =>
    createInitialDraft(session.id),
  );
  const [ready, setReady] = useState(false);

  const allQuestions = useMemo(
    () => getSessionBookingQuestions(session),
    [session],
  );
  const sessionQuestions = useMemo(
    () => getSessionSpecificQuestions(allQuestions),
    [allQuestions],
  );

  useEffect(() => {
    const saved = loadBookingDraft(session.id);
    const user = getCurrentUser();
    let next = saved ?? createInitialDraft(session.id);

    if (user?.role === "parent") {
      next = {
        ...next,
        accessMode: "logged_in",
        currentStep: next.currentStep === 1 ? 2 : next.currentStep,
      };
    }

    setDraft(next);
    setReady(true);
  }, [session.id]);

  useEffect(() => {
    if (ready) {
      saveBookingDraft(draft);
    }
  }, [draft, ready]);

  function goToStep(step: BookingFlowStep) {
    setDraft((current) => ({ ...current, currentStep: step }));
  }

  function handleAccessSelect() {
    setDraft((current) => ({
      ...current,
      accessMode: "guest",
      currentStep: 2,
    }));
  }

  const isLoggedInFlow =
    draft.accessMode === "logged_in" || getCurrentUser()?.role === "parent";
  const accessMode: "guest" | "parent" = isLoggedInFlow ? "parent" : "guest";
  const { mainImageId } = getSessionImages(session);

  if (!ready) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <BookingProgressBar currentStep={draft.currentStep} />

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-[16/9] bg-slate-100">
          <SessionImage
            imageId={mainImageId}
            alt={session.sessionTitle}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="border-b border-slate-100 px-5 py-4">
          <h1 className="text-lg font-bold text-[#0F172A]">{session.sessionTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {formatDay(session.day)} · {formatTimeRange(session.startTime, session.endTime)}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {draft.currentStep === 1 ? (
            <BookingAccessStep
              sessionId={session.id}
              onSelectGuest={handleAccessSelect}
            />
          ) : null}

          {draft.currentStep === 2 && isLoggedInFlow ? (
            <BookingLoggedInDetailsStep
              details={draft.details}
              onChange={(details) =>
                setDraft((current) => ({ ...current, details }))
              }
              onContinue={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          ) : null}

          {draft.currentStep === 2 && !isLoggedInFlow ? (
            <BookingGuestDetailsStep
              details={draft.details}
              onChange={(details) =>
                setDraft((current) => ({ ...current, details }))
              }
              onContinue={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          ) : null}

          {draft.currentStep === 3 ? (
            <BookingQuestionsStep
              questions={sessionQuestions}
              values={draft.questionValues}
              onChange={(questionValues) =>
                setDraft((current) => ({ ...current, questionValues }))
              }
              onContinue={() => goToStep(4)}
              onBack={() => goToStep(2)}
            />
          ) : null}

          {draft.currentStep === 4 ? (
            <BookingCheckoutStep
              session={session}
              details={draft.details}
              sessionQuestions={sessionQuestions}
              questionValues={draft.questionValues}
              accessMode={accessMode}
              onBack={() => goToStep(3)}
            />
          ) : null}
        </div>
      </div>

      {draft.currentStep > 1 ? (
        <button
          type="button"
          onClick={() => {
            clearBookingDraft(session.id);
            setDraft(createInitialDraft(session.id));
          }}
          className="mt-4 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Start over
        </button>
      ) : null}
    </div>
  );
}
