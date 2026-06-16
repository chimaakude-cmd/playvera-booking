"use client";

import {
  ONBOARDING_STEP_COUNT,
  STEP_TIME_REMAINING,
  type OnboardingStep,
} from "@/lib/club-onboarding";

type OnboardingProgressProps = {
  currentStep: OnboardingStep;
};

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const progress = (currentStep / ONBOARDING_STEP_COUNT) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-zinc-500">
        <span>
          Step {currentStep} of {ONBOARDING_STEP_COUNT}
        </span>
        <span>{STEP_TIME_REMAINING[currentStep]}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
