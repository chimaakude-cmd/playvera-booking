"use client";

import Link from "next/link";
import { ONBOARDING_PRECONFIGURED_LABELS } from "@/lib/message-templates";
import { SETUP_BASE_PERCENT } from "@/lib/club-setup";
import { navigateToClubDashboardAfterOnboarding } from "@/lib/club-onboarding/navigation";
import { OnboardingStepIntro } from "../shared";

type StepProps = {
  clubName: string;
};

export function Step4Complete({ clubName }: StepProps) {
  return (
    <div className="space-y-8 text-center">
      <OnboardingStepIntro
        title="Club created ✓"
        description={`${clubName || "Your club"} is live on the Free plan. Finish setup at your own pace from the dashboard.`}
      />

      <div className="mx-auto max-w-md rounded-2xl border border-teal-200 bg-teal-50/70 px-6 py-5 text-left">
        <p className="text-sm font-semibold text-teal-900">
          Your account comes preconfigured with:
        </p>
        <ul className="mt-3 space-y-1.5">
          {ONBOARDING_PRECONFIGURED_LABELS.map((label) => (
            <li key={label} className="flex items-center gap-2 text-sm text-teal-800">
              <span className="font-semibold text-teal-600">✓</span>
              {label}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-teal-700">
          Automated message templates are ready — customise anytime from
          Communications. Upgrade your plan anytime from Settings → Subscription
          &amp; billing.
        </p>
      </div>

      <div className="mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8">
        <p className="text-4xl font-bold text-emerald-700">{SETUP_BASE_PERCENT}%</p>
        <p className="mt-1 text-sm font-medium text-emerald-900">Setup complete</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-200">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${SETUP_BASE_PERCENT}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-emerald-800">
          Connect payments, add sessions, and more from your dashboard checklist.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={navigateToClubDashboardAfterOnboarding}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          Go to dashboard
        </button>
        <Link
          href="/club/create-session"
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Create your first session
        </Link>
      </div>
    </div>
  );
}
