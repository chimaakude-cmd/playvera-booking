import type { SupportContext, SupportMode } from "./types";

/**
 * Determines how support is routed for a given context.
 *
 * - PUBLIC / PARENT / CLUB ONBOARDING: AI first, escalate to human (hybrid)
 * - SIGNED-IN CLUB / ORGANISATION: human only — no AI
 * - ADMIN: human only
 */
export function getSupportMode(context: SupportContext): SupportMode {
  switch (context) {
    case "public":
    case "parent":
    case "club_onboarding":
      return "hybrid";
    case "club_signed_in":
    case "admin":
      return "human";
    default:
      return "hybrid";
  }
}

export function canUseAi(mode: SupportMode): boolean {
  return mode === "ai" || mode === "hybrid";
}

export function launcherLabel(
  context: SupportContext,
  mode: SupportMode,
): { status: "online" | "away"; label: string } {
  if (context === "club_signed_in" || mode === "human") {
    return { status: "online", label: "Human support available" };
  }
  if (mode === "hybrid") {
    return { status: "online", label: "AI + Human support" };
  }
  return { status: "online", label: "AI support active" };
}
