export const CLUB_ONBOARDING_DRAFT_KEY = "activora-club-onboarding-draft";
/** Legacy single-key draft — migrated on read/write. */
export const CLUB_ONBOARDING_DRAFT_LEGACY_KEY = CLUB_ONBOARDING_DRAFT_KEY;
export const CLUB_ONBOARDING_DRAFT_KEY_PREFIX = "activora-club-onboarding-draft";
export const CLUB_ONBOARDING_DRAFT_SESSION_KEY = `${CLUB_ONBOARDING_DRAFT_KEY_PREFIX}:session`;
export const CLUB_ONBOARDING_COMPLETE_KEY = "activora-club-onboarding-complete";

export const SAVE_PROGRESS_SUCCESS_MESSAGE = "Progress saved";
export const SAVE_PROGRESS_FAILURE_MESSAGE =
  "Couldn't save progress. Please try again.";
export const LEAVE_ONBOARDING_MESSAGE =
  "Leave onboarding? Your progress has been saved and you can continue later.";
export const ONBOARDING_AUTOSAVE_MICROCOPY =
  "Your progress is saved automatically.";
export const CLUB_DEFAULT_BOOKING_QUESTIONS_KEY =
  "activora-club-default-booking-questions";

import type { PlanId } from "@/src/config/pricing";
import { DEFAULT_PLAN_ID } from "@/src/config/pricing";

export const ONBOARDING_STEP_COUNT = 4;

export type OnboardingStep = 1 | 2 | 3 | 4;

export type ClubBusinessType = "club" | "company" | "franchise";

export const CLUB_BUSINESS_TYPE_LABELS: Record<ClubBusinessType, string> = {
  club: "Club",
  company: "Company",
  franchise: "Franchise",
};

/**
 * Account owner captured during onboarding.
 *
 * Field mapping (persisted on `owner`):
 * - ownerFirstName → firstName (required)
 * - ownerMiddleName → middleName (optional — never merge into firstName)
 * - ownerLastName → lastName (required)
 * - ownerEmail → email (required)
 * - ownerPhone → phone (required, national format)
 * - ownerPhoneCountry → phoneCountry (required, ISO country code e.g. GB)
 * - ownerPassword → password (required)
 */
export type OnboardingOwner = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  password: string;
};

/** Compose first + middle + last for admin/dashboard display. */
export function formatOwnerFullLegalName(
  owner: Pick<OnboardingOwner, "firstName" | "middleName" | "lastName">,
): string {
  return [owner.firstName.trim(), owner.middleName.trim(), owner.lastName.trim()]
    .filter(Boolean)
    .join(" ");
}

export type OnboardingClub = {
  name: string;
  businessType: ClubBusinessType | "";
  primaryCategories: string[];
  secondaryActivities: string[];
  ageRanges: string[];
  suggestedTagline: string;
  suggestedDescription: string;
};

export type OnboardingProfile = {
  logoUrl: string | null;
  coverUrl: string | null;
  primaryColor: string;
  tagline: string;
  aboutText: string;
  skippedProfile: boolean;
};

/** Session-only image previews (base64 or uploaded URLs — never persisted as data URLs). */
export type OnboardingImagePreviews = {
  logoUrl: string | null;
  coverUrl: string | null;
};

export type ClubOnboardingState = {
  currentStep: OnboardingStep;
  planId: PlanId;
  owner: OnboardingOwner;
  club: OnboardingClub;
  profile: OnboardingProfile;
  completedAt: string | null;
  updatedAt: string;
  privacyPolicyAccepted: boolean;
};

export { DEFAULT_PLAN_ID };

export const ONBOARDING_PRIMARY_CATEGORY_OPTIONS = [
  "Sports",
  "Holiday Camps",
  "Breakfast Clubs",
  "After School Clubs",
  "Wraparound Care",
  "Dance",
  "Arts",
  "Education",
  "Tutoring",
  "Nursery",
  "Enrichment",
  "Other",
] as const;

export const ONBOARDING_SECONDARY_ACTIVITY_OPTIONS = [
  "Football",
  "Dodgeball",
  "Basketball",
  "Arts & Crafts",
  "Dance",
  "Cricket",
  "Rugby",
  "Tag Rugby",
  "Gymnastics",
  "Music",
  "Tennis",
  "Athletics",
  "Martial arts",
  "Multi-sports",
  "STEM",
  "Drama",
  "Netball",
  "Other",
] as const;

export const ONBOARDING_AGE_RANGE_OPTIONS = [
  "0–2 years",
  "3–5 years",
  "6–8 years",
  "9–11 years",
  "12–14 years",
  "15+ years",
] as const;

/** Combined categories for club profile storage. */
export function getClubCategories(club: OnboardingClub): string[] {
  return [...club.primaryCategories, ...club.secondaryActivities];
}

export const STEP_TIME_REMAINING: Record<OnboardingStep, string> = {
  1: "~3 mins left",
  2: "~2 mins left",
  3: "~1 min left",
  4: "Ready to launch",
};
