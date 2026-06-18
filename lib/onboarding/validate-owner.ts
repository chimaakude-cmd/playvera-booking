import type { OnboardingOwner } from "@/lib/club-onboarding/types";
import { validatePhone } from "@/lib/phone";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Step 1 owner/account validation shared by club and organisation onboarding. */
export function validateOwnerAccount(owner: OnboardingOwner): string[] {
  const errors: string[] = [];

  if (!owner.firstName.trim()) {
    errors.push("First name is required.");
  }
  if (!owner.lastName.trim()) {
    errors.push("Last name is required.");
  }
  if (!owner.email.trim()) {
    errors.push("Email is required.");
  } else if (!isValidEmail(owner.email)) {
    errors.push("Enter a valid email address.");
  }
  if (!owner.phone.trim()) {
    errors.push("Phone number is required.");
  } else if (!validatePhone(owner.phoneCountry, owner.phone)) {
    errors.push("Enter a valid phone number for the selected country.");
  }
  if (!owner.password.trim()) {
    errors.push("Password is required.");
  } else if (owner.password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  return errors;
}

/** Step 1 validation including confirm-password match. */
export function validateOwnerAccountWithConfirm(
  owner: OnboardingOwner,
  confirmPassword: string,
): string[] {
  const errors = validateOwnerAccount(owner);

  if (!confirmPassword.trim()) {
    errors.push("Please confirm your password.");
  } else if (owner.password !== confirmPassword) {
    errors.push("Passwords do not match.");
  }

  return errors;
}
