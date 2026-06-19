import { readAuthSession } from "@/lib/auth/session";
import { getClubProfile } from "@/lib/club-profile";
import { isPlaceholderEmail, isRealEmail } from "@/lib/email/placeholder";
import {
  CLUB_ONBOARDING_COMPLETE_KEY,
  CLUB_ONBOARDING_DRAFT_KEY_PREFIX,
} from "@/lib/club-onboarding/types";

function readOnboardingOwnerEmail(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(CLUB_ONBOARDING_DRAFT_KEY_PREFIX)) {
        continue;
      }

      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as { owner?: { email?: string } };
      const email = parsed.owner?.email?.trim();
      if (email && isRealEmail(email)) {
        return email;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Resolve the club owner's real email.
 * Priority: authenticated account → onboarding draft → club profile contact.
 */
export function resolveClubOwnerEmail(): string {
  const session = typeof window !== "undefined" ? readAuthSession() : null;

  if (session?.email && isRealEmail(session.email)) {
    return session.email.trim();
  }

  const onboardingEmail = readOnboardingOwnerEmail();
  if (onboardingEmail) {
    return onboardingEmail;
  }

  if (typeof window !== "undefined") {
    const profileEmail = getClubProfile().contact.email.trim();
    if (isRealEmail(profileEmail)) {
      return profileEmail;
    }
  }

  return session?.email?.trim() ?? "";
}

export function hasCompletedClubOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(CLUB_ONBOARDING_COMPLETE_KEY) === "true";
}

export function isRealClubAccountSession(): boolean {
  const session = typeof window !== "undefined" ? readAuthSession() : null;
  if (!session || session.role !== "club") {
    return false;
  }

  return (
    isRealEmail(session.email) ||
    hasCompletedClubOnboarding() ||
    Boolean(resolveClubOwnerEmail())
  );
}

export { isPlaceholderEmail, isRealEmail };
