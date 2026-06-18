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
  };
}

export { validateOwnerAccount };

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
  if (!slugifyClubName(state.club.name)) {
    errors.push(
      "Please complete a valid club name before continuing.",
    );
  }
  return errors;
}
