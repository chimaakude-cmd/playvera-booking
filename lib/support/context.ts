import { readAuthSession } from "@/lib/auth/session";
import type { SupportContext } from "./types";

const CLUB_PUBLIC_PATHS = ["/club/login", "/club/signup", "/club/forgot-password"];

function isClubOnboardingPath(pathname: string): boolean {
  return pathname.startsWith("/club/onboarding");
}

function isClubSignedInPath(pathname: string): boolean {
  if (!pathname.startsWith("/club")) {
    return false;
  }
  if (isClubOnboardingPath(pathname)) {
    return false;
  }
  return !CLUB_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Detect support context from pathname and auth role.
 */
export function detectSupportContext(pathname: string): SupportContext {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  const session = readAuthSession();

  if (pathname.startsWith("/organisation")) {
    return session?.role === "organisation" || session?.role === "club"
      ? "club_signed_in"
      : "public";
  }

  if (isClubOnboardingPath(pathname)) {
    return "club_onboarding";
  }

  if (isClubSignedInPath(pathname)) {
    if (session?.role === "club" || session?.role === "organisation") {
      return "club_signed_in";
    }
    return "club_onboarding";
  }

  if (pathname.startsWith("/parent")) {
    if (session?.role === "parent") {
      return "parent";
    }
    return "public";
  }

  return "public";
}

export function contextLabel(context: SupportContext): string {
  const labels: Record<SupportContext, string> = {
    public: "Public website",
    parent: "Parent account",
    club_onboarding: "Club onboarding",
    club_signed_in: "Club account",
    admin: "Admin",
  };
  return labels[context];
}
