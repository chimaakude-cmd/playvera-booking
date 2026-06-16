import type { ClubOnboardingState } from "./types";

/** Profile completeness for onboarding step 3 (0–100). */
export function calculateProfileCompleteness(
  state: ClubOnboardingState,
): number {
  const profile = state.profile;
  let score = 0;

  if (profile.logoUrl) {
    score += 30;
  }
  if (profile.coverUrl) {
    score += 15;
  }
  if (profile.tagline.trim()) {
    score += 20;
  }
  if (profile.aboutText.trim()) {
    score += 25;
  }
  if (profile.primaryColor) {
    score += 10;
  }

  return Math.min(100, score);
}
