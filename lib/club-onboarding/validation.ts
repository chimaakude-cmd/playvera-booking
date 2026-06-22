import { slugifyClubName } from "@/lib/club-profile/types";
import { validateOwnerAccount } from "@/lib/onboarding/validate-owner";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone";
import { normalizePlanId } from "@/src/config/pricing";
import type { ClubOnboardingState, OnboardingStep } from "./types";
import { DEFAULT_PLAN_ID } from "./types";

export function createInitialOnboardingState(): ClubOnboardingState {
  return {
    currentStep: 1,
    planId: DEFAULT_PLAN_ID,
    owner: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      phoneCountry: DEFAULT_PHONE_COUNTRY,
    },
    club: {
      name: "",
      businessType: "",
      primaryCategories: [],
      secondaryActivities: [],
      ageRanges: [],
      suggestedTagline: "",
      suggestedDescription: "",
    },
    profile: {
      logoUrl: null,
      coverUrl: null,
      primaryColor: "#0d9488",
      tagline: "",
      aboutText: "",
      skippedProfile: false,
    },
    completedAt: null,
    updatedAt: new Date().toISOString(),
    privacyPolicyAccepted: false,
  };
}

export {
  validateOwnerAccount,
  validateOwnerAccountWithConfirm,
} from "@/lib/onboarding/validate-owner";

function stepBlockMessage(label: string): string {
  return `Please complete ${label} before continuing.`;
}

export function validateOnboardingStep(
  step: OnboardingStep,
  state: ClubOnboardingState,
): string[] {
  const errors: string[] = [];

  switch (step) {
    case 1: {
      errors.push(...validateOwnerAccount(state.owner));
      if (!state.club.businessType) {
        errors.push(stepBlockMessage("business type"));
      }
      if (!state.privacyPolicyAccepted) {
        errors.push("Please accept the Privacy Policy to continue.");
      }
      break;
    }
    case 2: {
      if (!state.club.name.trim()) {
        errors.push(stepBlockMessage("club name"));
      }
      if (state.club.primaryCategories.length === 0) {
        errors.push(stepBlockMessage("at least one activity category"));
      }
      if (state.club.secondaryActivities.length === 0) {
        errors.push(stepBlockMessage("at least one specific activity"));
      }
      if (state.club.ageRanges.length === 0) {
        errors.push(stepBlockMessage("at least one age range"));
      }
      break;
    }
    case 3: {
      if (!state.club.name.trim()) {
        errors.push(stepBlockMessage("club name"));
      }
      break;
    }
    case 4:
      break;
  }

  return errors;
}

export function syncDerivedOnboardingFields(
  state: ClubOnboardingState,
): ClubOnboardingState {
  const tagline =
    state.profile.tagline.trim() || state.club.suggestedTagline.trim();
  const aboutText =
    state.profile.aboutText.trim() || state.club.suggestedDescription.trim();

  return {
    ...state,
    planId: DEFAULT_PLAN_ID,
    club: {
      ...state.club,
      name: state.club.name.trim(),
    },
    profile: {
      ...state.profile,
      tagline,
      aboutText,
    },
  };
}

export function validateOnboardingForCompletion(
  state: ClubOnboardingState,
): string[] {
  const errors: string[] = [];
  for (let step = 1; step <= 2; step += 1) {
    errors.push(...validateOnboardingStep(step as OnboardingStep, state));
  }
  if (!state.owner.password.trim()) {
    errors.push("Password is required.");
  }
  if (!state.privacyPolicyAccepted) {
    errors.push("Please accept the Privacy Policy to continue.");
  }
  if (!slugifyClubName(state.club.name)) {
    errors.push(
      "Please complete a valid club name before continuing.",
    );
  }
  return errors;
}

const ERROR_STEP_HINTS: Array<{ step: OnboardingStep; pattern: RegExp }> = [
  { step: 1, pattern: /password|confirm your password|passwords do not match|email|first name|last name|phone|business type|account|privacy policy/i },
  { step: 2, pattern: /club name|category|activit|age range|valid club name/i },
  { step: 3, pattern: /profile|logo|cover|tagline/i },
];

/** Map a validation or submit error to the onboarding step that should fix it. */
export function mapOnboardingErrorToStep(error: string): OnboardingStep | null {
  for (const hint of ERROR_STEP_HINTS) {
    if (hint.pattern.test(error)) {
      return hint.step;
    }
  }
  return null;
}

/** Earliest step referenced by a list of validation errors. */
export function getEarliestOnboardingErrorStep(
  errors: string[],
): OnboardingStep | null {
  let earliest: OnboardingStep | null = null;

  for (const error of errors) {
    const step = mapOnboardingErrorToStep(error);
    if (step && (earliest === null || step < earliest)) {
      earliest = step;
    }
  }

  return earliest;
}
