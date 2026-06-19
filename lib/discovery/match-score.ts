import type { ClubSession } from "@/lib/sessions";
import type { ParentSessionSearchFilters } from "@/lib/session-search";
import { getProviderTrust, getSessionRating } from "./session-display";

function hashSessionId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseAgeFromRange(ageRange: string): number | null {
  const match = ageRange.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function childAgeMatches(session: ClubSession, childAge: string): boolean {
  const query = childAge.trim();
  if (!query) {
    return true;
  }
  if (session.ageRange.toLowerCase().includes(query.toLowerCase())) {
    return true;
  }
  const childAgeNum = Number(query);
  const sessionMin = parseAgeFromRange(session.ageRange);
  if (!Number.isNaN(childAgeNum) && sessionMin !== null) {
    return childAgeNum >= sessionMin;
  }
  return false;
}

export type ActivityDiscoveryScore = {
  score: number;
  label: string;
};

function scoreLabel(score: number): string {
  if (score >= 90) {
    return "Excellent Match";
  }
  if (score >= 75) {
    return "Great Match";
  }
  if (score >= 60) {
    return "Good Match";
  }
  return "Fair Match";
}

export function computeActivityDiscoveryScore(
  session: ClubSession,
  filters: ParentSessionSearchFilters,
  distanceMiles: number | null,
): ActivityDiscoveryScore {
  const hash = hashSessionId(session.id);
  const rating = getSessionRating(session);
  const trust = getProviderTrust(session);
  const repeatPercent = Number.parseInt(trust.repeatRate, 10) || 70;
  const attendancePercent = Number.parseInt(trust.attendance, 10) || 92;

  let distanceScore = 70;
  if (distanceMiles !== null) {
    const radius = Number(filters.radius) || 10;
    distanceScore = Math.max(0, 100 - (distanceMiles / radius) * 60);
  }

  const reviewScore =
    rating > 0 ? ((rating - 3) / 2) * 100 : 0;
  const attendanceScore = attendancePercent;
  const repeatScore = repeatPercent;
  const ageScore = childAgeMatches(session, filters.childAge) ? 100 : 55;
  const popularityScore = 50 + (session.bookings % 50);

  const score = Math.round(
    distanceScore * 0.25 +
      reviewScore * 0.2 +
      attendanceScore * 0.15 +
      repeatScore * 0.15 +
      ageScore * 0.15 +
      popularityScore * 0.1 +
      (hash % 7),
  );

  const clamped = Math.min(99, Math.max(52, score));

  return {
    score: clamped,
    label: scoreLabel(clamped),
  };
}
