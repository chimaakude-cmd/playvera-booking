import type { AuthError } from "@supabase/supabase-js";
import type { UserRole } from "./types";

export type LoginErrorKind =
  | "invalidEmail"
  | "noAccount"
  | "wrongPassword"
  | "wrongPortal"
  | "unverified"
  | "rateLimited"
  | "generic";

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorKind, string> = {
  invalidEmail: "Please enter a valid email address.",
  noAccount:
    "No account was found for this email. You can create an account or recover access.",
  wrongPassword:
    "The password is incorrect. Try again or recover your account.",
  wrongPortal:
    "This account belongs to a different portal. Please use the correct sign-in page.",
  unverified: "Please verify your email before signing in.",
  rateLimited: "Too many attempts. Please try again shortly.",
  generic: "Unable to sign in right now. Please try again.",
};

export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "If an account exists for this email, password reset instructions have been sent.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidLoginEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function loginErrorMessage(kind: LoginErrorKind): string {
  return LOGIN_ERROR_MESSAGES[kind];
}

export function mapSupabaseAuthError(error: AuthError | null): LoginErrorKind {
  if (!error) {
    return "generic";
  }

  const message = error.message.toLowerCase();
  const code = error.code?.toLowerCase() ?? "";

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return "wrongPassword";
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "unverified";
  }

  if (
    code === "over_request_rate_limit" ||
    code === "too_many_requests" ||
    message.includes("rate limit")
  ) {
    return "rateLimited";
  }

  if (
    code === "validation_failed" &&
    message.includes("invalid email")
  ) {
    return "invalidEmail";
  }

  return "generic";
}

export function portalLabel(role: UserRole): string {
  switch (role) {
    case "club":
      return "Club";
    case "parent":
      return "Parent";
    case "admin":
      return "Staff";
    case "organisation":
      return "Franchisor";
  }
}
