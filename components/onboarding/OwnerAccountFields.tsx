"use client";

import { PhoneInput } from "@/components/ui/PhoneInput";
import type { OnboardingOwner } from "@/lib/club-onboarding/types";
import {
  OnboardingField,
  OnboardingInfoBox,
  onboardingInputClassName,
} from "@/components/club/onboarding/shared";

type OwnerAccountFieldsProps = {
  owner: OnboardingOwner;
  onChange: (updates: Partial<OnboardingOwner>) => void;
  loginHint?: React.ReactNode;
  phoneFieldError?: string;
};

export function OwnerAccountFields({
  owner,
  onChange,
  loginHint,
  phoneFieldError,
}: OwnerAccountFieldsProps) {
  function updateOwner(field: keyof OnboardingOwner, value: string) {
    onChange({ [field]: value });
  }

  function handlePhoneChange(country: string, phone: string) {
    onChange({ phoneCountry: country, phone });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <OnboardingField label="First name" htmlFor="owner-first" required>
          <input
            id="owner-first"
            value={owner.firstName}
            onChange={(event) => updateOwner("firstName", event.target.value)}
            className={onboardingInputClassName}
            autoComplete="given-name"
          />
        </OnboardingField>
        <OnboardingField label="Middle name" htmlFor="owner-middle">
          <input
            id="owner-middle"
            value={owner.middleName}
            onChange={(event) => updateOwner("middleName", event.target.value)}
            className={onboardingInputClassName}
            autoComplete="additional-name"
          />
        </OnboardingField>
      </div>

      <OnboardingField label="Last name" htmlFor="owner-last" required>
        <input
          id="owner-last"
          value={owner.lastName}
          onChange={(event) => updateOwner("lastName", event.target.value)}
          className={onboardingInputClassName}
          autoComplete="family-name"
        />
      </OnboardingField>

      <OnboardingField label="Email" htmlFor="owner-email" required>
        <input
          id="owner-email"
          type="email"
          value={owner.email}
          onChange={(event) => updateOwner("email", event.target.value)}
          className={onboardingInputClassName}
          autoComplete="email"
        />
      </OnboardingField>

      <OnboardingField
        label="Phone number"
        htmlFor="owner-phone"
        required
        error={phoneFieldError}
        hint="We require a contact number so Activeora can contact your club if there are issues with bookings, payments, safeguarding, onboarding, or account verification."
      >
        <PhoneInput
          id="owner-phone"
          country={owner.phoneCountry}
          value={owner.phone}
          onChange={handlePhoneChange}
          inputClassName={onboardingInputClassName}
        />
      </OnboardingField>

      <OnboardingField
        label="Password"
        htmlFor="owner-password"
        required
        hint="At least 8 characters."
      >
        <input
          id="owner-password"
          type="password"
          value={owner.password}
          onChange={(event) => updateOwner("password", event.target.value)}
          className={onboardingInputClassName}
          autoComplete="new-password"
        />
      </OnboardingField>

      {loginHint ? <OnboardingInfoBox>{loginHint}</OnboardingInfoBox> : null}
    </div>
  );
}
