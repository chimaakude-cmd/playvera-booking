"use client";

import { ReactNode } from "react";
import { Logo } from "@/components/branding";
import { HOME_BUTTON } from "@/components/home/shared";
import { ACTIVORA_PRIMARY } from "@/lib/home/constants";
import {
  ONBOARDING_AUTOSAVE_MICROCOPY,
  ONBOARDING_STEP_COUNT,
  type OnboardingStep,
} from "@/lib/club-onboarding";
import { ONBOARDING_STEPS } from "@/lib/club-onboarding/steps";
import { OnboardingHelp } from "./OnboardingHelp";
import { OnboardingProgress } from "./OnboardingProgress";

type OnboardingLayoutProps = {
  currentStep: OnboardingStep;
  maxCompletedStep: OnboardingStep;
  onStepSelect: (step: OnboardingStep) => void;
  children: ReactNode;
  footer: ReactNode;
  allowStepNavigation?: boolean;
  onBack?: () => void;
  showBack?: boolean;
};

function canNavigateToStep(
  step: OnboardingStep,
  currentStep: OnboardingStep,
  maxCompletedStep: OnboardingStep,
): boolean {
  return step <= maxCompletedStep || step < currentStep;
}

export function OnboardingLayout({
  currentStep,
  maxCompletedStep,
  onStepSelect,
  children,
  footer,
  allowStepNavigation = true,
  onBack,
  showBack = true,
}: OnboardingLayoutProps) {
  const stepMeta = ONBOARDING_STEPS[currentStep - 1];

  return (
    <div className="min-h-full bg-[#f6f7f9] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
              {onBack && showBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className={`inline-flex shrink-0 items-center border border-slate-200 bg-white px-3 py-2 text-sm font-semibold transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2 sm:px-4 ${HOME_BUTTON}`}
                  style={{ color: ACTIVORA_PRIMARY }}
                >
                  ← Back
                </button>
              ) : null}
              <Logo size="desktop" />
            </div>
            <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
              Club onboarding
            </span>
          </div>
          {onBack && showBack ? (
            <p className="mt-2 text-xs text-slate-500">{ONBOARDING_AUTOSAVE_MICROCOPY}</p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <OnboardingProgress currentStep={currentStep} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <ol className="space-y-1.5">
              {ONBOARDING_STEPS.map((entry) => {
                const isActive = entry.id === currentStep;
                const isComplete =
                  entry.id < currentStep ||
                  (entry.id <= maxCompletedStep && entry.id !== currentStep);
                const isReachable = canNavigateToStep(
                  entry.id,
                  currentStep,
                  maxCompletedStep,
                );
                const isClickable = allowStepNavigation && isReachable;

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isClickable) {
                          onStepSelect(entry.id);
                        }
                      }}
                      disabled={!isClickable}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-zinc-900 text-white"
                          : isComplete
                            ? "text-zinc-700 hover:bg-white"
                            : isReachable
                              ? "text-zinc-600 hover:bg-white"
                              : "text-zinc-400"
                      } ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isActive
                            ? "bg-white text-zinc-900"
                            : isComplete
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {isComplete ? "✓" : entry.id}
                      </span>
                      <span className="font-medium">{entry.shortTitle}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
                  Step {currentStep} of {ONBOARDING_STEP_COUNT}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-zinc-900">
                  {stepMeta.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {stepMeta.description}
                </p>
              </div>
              <OnboardingHelp step={currentStep} />
            </div>

            <div className="mt-8">{children}</div>

            <div className="mt-8 border-t border-zinc-100 pt-6">{footer}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
