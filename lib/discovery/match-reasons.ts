import type { ClubSession } from "@/lib/sessions";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import { getDemoSocialProof } from "./session-display";

export type MatchReason = {
  icon: string;
  text: string;
};

export function getMatchReasons(
  session: ClubSession,
  filters: HomeSearchFilters,
  distanceMiles: number | null,
): MatchReason[] {
  const reasons: MatchReason[] = [];

  if (distanceMiles !== null && filters.location.trim()) {
    reasons.push({
      icon: "✓",
      text: `Within ${distanceMiles.toFixed(1)} miles`,
    });
  } else if (filters.location.trim()) {
    reasons.push({
      icon: "✓",
      text: `Near ${filters.location.trim()}`,
    });
  }

  if (filters.childAge.trim()) {
    reasons.push({
      icon: "✓",
      text: `Age range fits ${filters.childAge.trim()}`,
    });
  } else if (session.ageRange) {
    reasons.push({
      icon: "✓",
      text: `Ages ${session.ageRange}`,
    });
  }

  const socialProof = getDemoSocialProof(session);
  if (socialProof.bookedToday >= 8 || session.bookings >= 10) {
    reasons.push({
      icon: "✓",
      text: "Popular nearby",
    });
  } else {
    reasons.push({
      icon: "✓",
      text: "Highly rated locally",
    });
  }

  return reasons.slice(0, 3);
}
