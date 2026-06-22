"use client";

import {
  CLUB_BUSINESS_TYPE_LABELS,
  type ClubBusinessType,
  type ClubOnboardingState,
} from "@/lib/club-onboarding";
import { OwnerAccountFields } from "@/components/onboarding/OwnerAccountFields";
import { PrivacyAcceptanceCheckbox } from "@/components/privacy/PrivacyAcceptanceCheckbox";
import { OnboardingField, OnboardingStepIntro } from "../shared";

type StepProps = {
  state: ClubOnboardingState;
  onChange: (updates: Partial<ClubOnboardingState>) => void;
  passwordConfirm: string;
  onPasswordConfirmChange: (value: string) => void;
};

export function Step1AccountOwner({
  state,
  onChange,
  passwordConfirm,
  onPasswordConfirmChange,
}: StepProps) {
  function updateOwner(updates: Partial<ClubOnboardingState["owner"]>) {
    onChange({ owner: { ...state.owner, ...updates } });
  }

  function updateBusinessType(businessType: ClubBusinessType) {
    onChange({ club: { ...state.club, businessType } });
  }

  return (
    <div className="space-y-6">
      <OnboardingStepIntro
        title="Create your account"
        description="About 60 seconds — you'll use this to sign in and manage your club."
      />

      <OwnerAccountFields
        owner={state.owner}
        onChange={updateOwner}
        passwordConfirm={passwordConfirm}
        onPasswordConfirmChange={onPasswordConfirmChange}
        loginHint={
          <>
            Sign in at <strong>/club/login</strong> with this email and password.
          </>
        }
      />

      <OnboardingField label="Business type" htmlFor="business-type" required>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.entries(CLUB_BUSINESS_TYPE_LABELS) as [ClubBusinessType, string][]).map(
            ([value, label]) => {
              const selected = state.club.businessType === value;
              return (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    selected
                      ? "border-teal-300 bg-teal-50 text-teal-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="business-type"
                    value={value}
                    checked={selected}
                    onChange={() => updateBusinessType(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              );
            },
          )}
        </div>
      </OnboardingField>

      <PrivacyAcceptanceCheckbox
        id="club-onboarding-privacy"
        checked={state.privacyPolicyAccepted}
        onChange={(privacyPolicyAccepted) => onChange({ privacyPolicyAccepted })}
        className="pt-2"
      />
    </div>
  );
}
