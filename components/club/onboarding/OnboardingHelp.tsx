"use client";

import { useState } from "react";
import { getStepMeta, type OnboardingStep } from "@/lib/club-onboarding";

type OnboardingHelpProps = {
  step: OnboardingStep;
};

export function OnboardingHelp({ step }: OnboardingHelpProps) {
  const [open, setOpen] = useState(false);
  const help = getStepMeta(step).help;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100"
        aria-expanded={open}
      >
        <span aria-hidden>?</span>
        Help
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-zinc-900">What this step is for</p>
          <p className="mt-1 text-sm text-zinc-600">{help.purpose}</p>

          <p className="mt-3 text-sm font-semibold text-zinc-900">Why we need this</p>
          <p className="mt-1 text-sm text-zinc-600">{help.whyNeeded}</p>

          <p className="mt-3 text-sm font-semibold text-zinc-900">Examples</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-600">
            {help.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>

          {help.tip ? (
            <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-900">
              {help.tip}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-zinc-500">
            Stuck? Use the chat bubble — our team (and Chima AI) can help.
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs font-medium text-teal-700 hover:text-teal-900"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
