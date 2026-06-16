"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import {
  ONBOARDING_STEP_COUNT,
  clearOnboardingDraft,
  completeClubOnboarding,
  createInitialOnboardingState,
  DRAFT_SAVE_QUOTA_WARNING,
  loadOnboardingDraft,
  saveOnboardingDraft,
  syncDerivedOnboardingFields,
  validateOnboardingStep,
  type ClubOnboardingState,
  type OnboardingImagePreviews,
  type OnboardingStep,
} from "@/lib/club-onboarding";
import { OnboardingLayout } from "./OnboardingLayout";
import { Step1AccountOwner } from "./steps/Step1AccountOwner";
import { Step2ChoosePlan } from "./steps/Step2ChoosePlan";
import { Step2AboutClub } from "./steps/Step2AboutClub";
import { Step3ClubProfile } from "./steps/Step3ClubProfile";
import { Step4Complete } from "./steps/Step4Complete";

const AUTOSAVE_MS = 400;

function mergeImagePreviews(
  state: ClubOnboardingState,
  imagePreviews: OnboardingImagePreviews,
): ClubOnboardingState {
  return {
    ...state,
    profile: {
      ...state.profile,
      logoUrl: imagePreviews.logoUrl,
      coverUrl: imagePreviews.coverUrl,
    },
  };
}

export function ClubOnboardingWizard() {
  const [state, setState] = useState<ClubOnboardingState | null>(null);
  const [imagePreviews, setImagePreviews] = useState<OnboardingImagePreviews>({
    logoUrl: null,
    coverUrl: null,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCompletionRef = useRef(false);
  const imagePreviewsRef = useRef(imagePreviews);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    const draft = loadOnboardingDraft();
    setState(draft);
    setImagePreviews({
      logoUrl: draft.profile.logoUrl,
      coverUrl: draft.profile.coverUrl,
    });
  }, []);

  const saveDraft = useCallback((next: ClubOnboardingState) => {
    const result = saveOnboardingDraft(next);
    if (!result.ok) {
      setDraftWarning(DRAFT_SAVE_QUOTA_WARNING);
      return;
    }
    setDraftWarning(null);
  }, []);

  const persist = useCallback(
    (next: ClubOnboardingState) => {
      setState(next);
      saveDraft(next);
    },
    [saveDraft],
  );

  useEffect(() => {
    if (!state) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveDraft(state);
    }, AUTOSAVE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [state, saveDraft]);

  useEffect(() => {
    if (!state || state.currentStep !== 5) {
      pendingCompletionRef.current = false;
    }
  }, [state?.currentStep]);

  useEffect(() => {
    if (
      state?.currentStep === 5 &&
      !state.completedAt &&
      !completing &&
      errors.length === 0
    ) {
      pendingCompletionRef.current = true;
    }
  }, [state?.currentStep, state?.completedAt, completing, errors.length]);

  useEffect(() => {
    if (
      !state ||
      !pendingCompletionRef.current ||
      state.currentStep !== 5 ||
      state.completedAt ||
      completing
    ) {
      return;
    }

    pendingCompletionRef.current = false;
    finishOnboarding(mergeImagePreviews(state, imagePreviewsRef.current));
  }, [state, completing]);

  function updateState(updates: Partial<ClubOnboardingState>) {
    if (!state) {
      return;
    }
    const next = { ...state, ...updates };
    persist(next);
    setErrors([]);
  }

  function updateImagePreviews(updates: Partial<OnboardingImagePreviews>) {
    setImagePreviews((current) => ({ ...current, ...updates }));
    setErrors([]);
  }

  function handleClearDraft() {
    clearOnboardingDraft();
    const initial = createInitialOnboardingState();
    setState(initial);
    setImagePreviews({ logoUrl: null, coverUrl: null });
    setErrors([]);
    setDraftWarning(null);
  }

  function goToStep(step: OnboardingStep) {
    if (!state) {
      return;
    }
    persist({ ...state, currentStep: step });
    setErrors([]);
    if (step === 5 && !state.completedAt) {
      pendingCompletionRef.current = true;
    }
  }

  function finishOnboarding(current: ClubOnboardingState) {
    setCompleting(true);
    setErrors([]);

    const result = completeClubOnboarding(current);
    if (!result.success) {
      setErrors(result.errors);
      setCompleting(false);
      return;
    }

    setState({
      ...syncDerivedOnboardingFields(current),
      currentStep: 5,
      completedAt: new Date().toISOString(),
    });
    setCompleting(false);
  }

  function handleNext() {
    if (!state) {
      return;
    }

    const withImages = mergeImagePreviews(state, imagePreviews);
    const synced = syncDerivedOnboardingFields(withImages);

    const stepErrors = validateOnboardingStep(synced.currentStep, synced);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    if (synced.currentStep < ONBOARDING_STEP_COUNT) {
      goToStep((synced.currentStep + 1) as OnboardingStep);
    }
  }

  function handleBack() {
    if (!state || state.currentStep <= 1 || state.currentStep === 5) {
      return;
    }
    goToStep((state.currentStep - 1) as OnboardingStep);
  }

  function handleSkipProfile() {
    if (!state) {
      return;
    }
    persist({
      ...state,
      profile: { ...state.profile, skippedProfile: true },
      currentStep: 5,
    });
    setErrors([]);
    if (!state.completedAt) {
      pendingCompletionRef.current = true;
    }
  }

  function handleRetryCompletion() {
    if (!state) {
      return;
    }
    finishOnboarding(mergeImagePreviews(state, imagePreviews));
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-teal-600" />
      </div>
    );
  }

  const step = state.currentStep;
  const isCompleteStep = step === 5;
  const isProfileStep = step === 4;
  const isFinishing =
    completing ||
    (isCompleteStep && !state.completedAt && errors.length === 0);

  const completeStepFooter = isFinishing ? null : errors.length > 0 ? (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => goToStep(3)}
        className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        Back to club details
      </button>
      <button
        type="button"
        onClick={handleRetryCompletion}
        disabled={completing}
        className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Try again
      </button>
    </div>
  ) : state.completedAt ? (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Link
        href="/club/create-session"
        className="rounded-xl border border-zinc-200 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        Create your first session
      </Link>
      <Link
        href="/club/dashboard?setup=1"
        className="rounded-xl bg-teal-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-teal-700"
      >
        Go to dashboard
      </Link>
    </div>
  ) : null;

  const footer = isCompleteStep ? completeStepFooter : (
    <>
      {draftWarning ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">{draftWarning}</p>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || completing}
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleClearDraft}
            disabled={completing}
            className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline disabled:opacity-50"
          >
            Clear onboarding draft
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isProfileStep ? (
            <button
              type="button"
              onClick={handleSkipProfile}
              disabled={completing}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Skip for now
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleNext}
            disabled={completing}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completing
              ? "Creating club…"
              : isProfileStep
                ? "Continue"
                : "Continue"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <OnboardingLayout
        currentStep={step}
        onStepSelect={goToStep}
        footer={footer}
        allowStepNavigation={!isCompleteStep}
      >
        {step === 1 ? (
          <Step1AccountOwner state={state} onChange={updateState} />
        ) : null}
        {step === 2 ? (
          <Suspense
            fallback={
              <div className="py-12 text-center text-sm text-zinc-500">
                Loading plans…
              </div>
            }
          >
            <Step2ChoosePlan state={state} onChange={updateState} />
          </Suspense>
        ) : null}
        {step === 3 ? (
          <Step2AboutClub state={state} onChange={updateState} />
        ) : null}
        {step === 4 ? (
          <Step3ClubProfile
            state={state}
            onChange={updateState}
            imagePreviews={imagePreviews}
            onImagePreviewChange={updateImagePreviews}
          />
        ) : null}
        {step === 5 ? (
          isFinishing ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-teal-600" />
              <p className="mt-4 text-sm font-medium text-zinc-600">
                Creating your club…
              </p>
            </div>
          ) : errors.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                We couldn&apos;t finish setting up your club:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : (
            <Step4Complete clubName={state.club.name} planId={state.planId} />
          )
        ) : null}
      </OnboardingLayout>

      <LazySupportLauncher />
    </>
  );
}
