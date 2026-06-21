"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  initialWizardFormData,
  paymentModelToBookingStructure,
  saveWizardSession,
  validatePaymentModelStep,
  validateWizardForPublish,
  validateWizardStep,
  WIZARD_STEP_LABELS,
  WizardFormData,
  WizardStep,
} from "@/lib/session-wizard";
import {
  clearSessionWizardDraft,
  loadSessionWizardDraft,
  saveSessionWizardDraft,
  type SessionWizardPhase,
} from "@/lib/session-wizard/draft-storage";
import {
  canPublishPaidSessions,
  getPaidSessionBlockMessage,
  sessionHasPaidTickets,
} from "@/lib/club-setup";
import { CopyFromExistingStep } from "./CopyFromExistingStep";
import { PaymentModelStep } from "./PaymentModelStep";
import { CapacityStep } from "./CapacityStep";
import { StepperButton } from "./shared";
import { SectionSkeleton } from "@/components/ui/SectionSkeleton";

const SessionDetailsStep = dynamic(
  () => import("./SessionDetailsStep").then((m) => m.SessionDetailsStep),
  { loading: () => <SectionSkeleton rows={5} /> },
);
const LocationStep = dynamic(
  () => import("./LocationStep").then((m) => m.LocationStep),
  { loading: () => <SectionSkeleton rows={4} />, ssr: false },
);
const ScheduleCalendarStep = dynamic(
  () => import("./ScheduleCalendarStep").then((m) => m.ScheduleCalendarStep),
  { loading: () => <SectionSkeleton rows={6} /> },
);
const ConfirmationEmailStep = dynamic(
  () => import("./ConfirmationEmailStep").then((m) => m.ConfirmationEmailStep),
  { loading: () => <SectionSkeleton rows={3} /> },
);
const TicketsStep = dynamic(
  () => import("./TicketsStep").then((m) => m.TicketsStep),
  { loading: () => <SectionSkeleton rows={4} /> },
);
const BookingQuestionsStep = dynamic(
  () =>
    import("./BookingQuestionsStep").then((m) => m.BookingQuestionsStep),
  { loading: () => <SectionSkeleton rows={5} /> },
);
const ReviewStep = dynamic(
  () => import("./ReviewStep").then((m) => m.ReviewStep),
  { loading: () => <SectionSkeleton rows={5} /> },
);

const LAST_STEP = 7 satisfies WizardStep;

export function SessionWizard() {
  const router = useRouter();
  const [phase, setPhase] = useState<SessionWizardPhase>("payment");
  const [step, setStep] = useState<WizardStep>(0);
  const [data, setData] = useState<WizardFormData>(initialWizardFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const persistDraft = useCallback(
    (
      next: Partial<{
        phase: SessionWizardPhase;
        step: WizardStep;
        data: WizardFormData;
      }> = {},
    ) => {
      const draftPhase = next.phase ?? phase;
      const draftStep = next.step ?? step;
      const draftData = next.data ?? data;

      saveSessionWizardDraft({
        paymentModel: draftData.paymentModel,
        phase: draftPhase,
        step: draftStep,
        data: draftData,
      });
    },
    [data, phase, step],
  );

  useEffect(() => {
    const draft = loadSessionWizardDraft();
    if (draft) {
      setPhase(draft.phase);
      setStep(draft.step);
      setData(draft.data);
    }
    setDraftLoaded(true);
  }, []);

  function updateData(updates: Partial<WizardFormData>) {
    setData((current) => {
      const next: WizardFormData = { ...current, ...updates };

      if (updates.paymentModel) {
        next.bookingStructure = paymentModelToBookingStructure(
          updates.paymentModel,
          current.bookingStructure,
        );
      }

      persistDraft({ data: next });
      return next;
    });
    setErrors([]);
    setNotice(null);
  }

  function handlePaymentContinue() {
    const paymentErrors = validatePaymentModelStep(data);
    if (paymentErrors.length > 0) {
      setErrors(paymentErrors);
      return;
    }

    setErrors([]);
    setPhase("setup");
    persistDraft({ phase: "setup" });
  }

  function handleSetupStartFresh() {
    setPhase("wizard");
    setStep(0);
    persistDraft({ phase: "wizard", step: 0 });
  }

  function handleSetupCopyFrom(copied: WizardFormData) {
    const merged: WizardFormData = {
      ...copied,
      paymentModel: data.paymentModel,
      subscriptionConfig: data.subscriptionConfig,
      bookingStructure: data.paymentModel
        ? paymentModelToBookingStructure(
            data.paymentModel,
            copied.bookingStructure,
          )
        : copied.bookingStructure,
    };
    setData(merged);
    setPhase("wizard");
    setStep(0);
    persistDraft({ phase: "wizard", step: 0, data: merged });
  }

  function validateCurrentStep(): boolean {
    const stepErrors = validateWizardStep(step, data);
    setErrors(stepErrors);
    return stepErrors.length === 0;
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }

    const nextStep = Math.min(LAST_STEP, step + 1) as WizardStep;
    setStep(nextStep);
    persistDraft({ step: nextStep });
  }

  function handleBack() {
    setErrors([]);
    setNotice(null);

    if (phase === "wizard" && step === 0) {
      setPhase("setup");
      persistDraft({ phase: "setup" });
      return;
    }

    if (phase === "setup") {
      setPhase("payment");
      persistDraft({ phase: "payment" });
      return;
    }

    const previousStep = Math.max(0, step - 1) as WizardStep;
    setStep(previousStep);
    persistDraft({ step: previousStep });
  }

  function handlePublish() {
    const publishErrors = validateWizardForPublish(data);

    if (sessionHasPaidTickets(data) && !canPublishPaidSessions()) {
      setErrors([getPaidSessionBlockMessage()]);
      return;
    }

    setErrors(publishErrors);
    if (publishErrors.length > 0) {
      return;
    }

    setSaving(true);
    setErrors([]);
    setNotice(null);

    void saveWizardSession(data)
      .then(() => {
        clearSessionWizardDraft();
        router.push("/club/activities?created=1");
      })
      .catch((error) => {
        setErrors([
          error instanceof Error
            ? error.message
            : "Could not publish this session to Supabase.",
        ]);
        setSaving(false);
      });
  }

  const progress =
    phase === "wizard"
      ? Math.round(((step + 1) / WIZARD_STEP_LABELS.length) * 100)
      : 0;
  const paidBlocked =
    sessionHasPaidTickets(data) && !canPublishPaidSessions();

  if (!draftLoaded) {
    return <SectionSkeleton rows={6} />;
  }

  if (phase === "payment") {
    return (
      <div className="rounded-2xl border border-orange-100/80 bg-white p-4 shadow-sm sm:p-8">
        {errors.length > 0 ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">
              Please fix the following before continuing:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <PaymentModelStep
          data={{
            paymentModel: data.paymentModel,
            subscriptionConfig: data.subscriptionConfig,
            paymentProvider: data.paymentProvider,
          }}
          onChange={updateData}
        />

        <div className="mt-8 flex justify-end border-t border-orange-50 pt-6">
          <StepperButton variant="primary" onClick={handlePaymentContinue}>
            Continue
          </StepperButton>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="rounded-2xl border border-orange-100/80 bg-white p-4 shadow-sm sm:p-8">
        <CopyFromExistingStep
          onStartFresh={handleSetupStartFresh}
          onCopyFrom={handleSetupCopyFrom}
        />
        <div className="mt-8 border-t border-orange-50 pt-6">
          <StepperButton onClick={handleBack}>Back</StepperButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {paidBlocked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {getPaidSessionBlockMessage()}. Free sessions can still be published.
        </div>
      ) : null}

      <div className="rounded-2xl border border-orange-100/80 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F87128]">
              Activora
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Step {step + 1} of {WIZARD_STEP_LABELS.length}
            </p>
          </div>
          <p className="text-sm font-medium text-zinc-700">{progress}% complete</p>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[760px] gap-2">
            {WIZARD_STEP_LABELS.map((label, index) => {
              const stepNumber = index as WizardStep;
              const isActive = step === stepNumber;
              const isComplete = step > stepNumber;

              return (
                <div key={label} className="min-w-0 flex-1 space-y-2">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      isComplete
                        ? "bg-[#F87128]"
                        : isActive
                          ? "bg-orange-300"
                          : "bg-zinc-100"
                    }`}
                  />
                  <p
                    className={`truncate text-xs font-medium ${
                      isActive ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-100/80 bg-white p-4 shadow-sm sm:p-8">
        {errors.length > 0 ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">
              Please fix the following before continuing:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {notice ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {notice}
          </div>
        ) : null}

        {step === 0 ? (
          <SessionDetailsStep data={data} onChange={updateData} />
        ) : null}
        {step === 1 ? (
          <LocationStep data={data} onChange={updateData} />
        ) : null}
        {step === 2 ? (
          <ScheduleCalendarStep data={data} onChange={updateData} />
        ) : null}
        {step === 3 ? <CapacityStep data={data} onChange={updateData} /> : null}
        {step === 4 ? <TicketsStep data={data} onChange={updateData} /> : null}
        {step === 5 ? (
          <ConfirmationEmailStep data={data} onChange={updateData} />
        ) : null}
        {step === 6 ? (
          <BookingQuestionsStep data={data} onChange={updateData} />
        ) : null}
        {step === 7 ? <ReviewStep data={data} /> : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-orange-50 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <StepperButton onClick={handleBack} disabled={saving}>
            Back
          </StepperButton>

          {step < LAST_STEP ? (
            <StepperButton variant="primary" onClick={handleNext}>
              Next
            </StepperButton>
          ) : (
            <StepperButton
              variant="primary"
              onClick={handlePublish}
              disabled={saving}
            >
              {saving ? "Publishing..." : "Publish Session"}
            </StepperButton>
          )}
        </div>
      </div>
    </div>
  );
}
