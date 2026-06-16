import type { OnboardingClub } from "./types";

/**
 * Mock AI description generator for onboarding Step 2.
 * Replace with a real LLM call when backend is ready.
 */
export function generateClubDescription(
  club: OnboardingClub,
  clubName?: string,
): string {
  const name = clubName?.trim() || club.name.trim() || "Our club";
  const ages =
    club.ageRanges.length > 0
      ? club.ageRanges.join(", ")
      : "children and young people";
  const categories =
    club.primaryCategories.length > 0
      ? club.primaryCategories.join(", ")
      : "engaging programmes";
  const activities =
    club.secondaryActivities.length > 0
      ? club.secondaryActivities.join(", ")
      : "fun activities";

  return `${name} welcomes ${ages} to ${categories.toLowerCase()} featuring ${activities.toLowerCase()}. We provide a fun, safe environment where children build confidence, teamwork, and development through engaging sessions. Whether your child is trying something new or developing existing talents, our experienced team helps every child thrive.`;
}
