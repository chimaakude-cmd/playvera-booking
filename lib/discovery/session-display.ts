import type { ClubSession } from "@/lib/sessions";
import { getFeeSettings } from "@/lib/fee-settings";
import { calculatePaymentBreakdown, formatMoney } from "@/lib/payments";
import { getActivityRatingSummary } from "@/lib/reviews/ratings";
import { getReviews } from "@/lib/reviews/storage";
import {
  formatDay,
  formatTimeRange,
  getTicketPriceSummary,
} from "@/lib/sessions";

function hashSessionId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSessionRating(session: ClubSession): number {
  return getActivityRatingSummary(session.id, getReviews()).averageRating;
}

export function getSessionReviewCount(session: ClubSession): number {
  return getActivityRatingSummary(session.id, getReviews()).reviewCount;
}

export function getDemoSocialProof(session: ClubSession): {
  bookedToday: number;
  views: number;
} {
  const hash = hashSessionId(session.id);
  return {
    bookedToday: 3 + (hash % 18),
    views: 18 + (hash % 90),
  };
}

export function getProviderTrust(session: ClubSession): {
  responseTime: string;
  attendance: string;
  repeatRate: string;
  joined: string;
} {
  const hash = hashSessionId(session.id);
  const months = 3 + (hash % 30);
  return {
    responseTime: "Responds <24h",
    attendance: `${92 + (hash % 7)}% attendance`,
    repeatRate: `${68 + (hash % 25)}% repeat bookings`,
    joined: `Joined ${months} mo ago`,
  };
}

export type SessionBadge = "verified" | "popular" | "few-spaces";

export function getSessionBadges(session: ClubSession): SessionBadge[] {
  const badges: SessionBadge[] = [];
  const hash = hashSessionId(session.id);
  const spacesLeft = Math.max(0, session.capacity - session.bookings);

  if (hash % 3 !== 0) {
    badges.push("verified");
  }
  if (session.bookings >= 8 || hash % 5 === 0) {
    badges.push("popular");
  }
  if (spacesLeft > 0 && spacesLeft <= 4) {
    badges.push("few-spaces");
  }

  return badges;
}

export function getCustomerPriceForSession(session: ClubSession): number {
  const feeSettings = getFeeSettings();
  return calculatePaymentBreakdown(
    session.price,
    session.platformFeePercent,
    feeSettings.feeHandling,
  ).customerPrice;
}

export function getFromPriceLabel(session: ClubSession): string {
  const summary = getTicketPriceSummary(session);
  if (summary.includes("Free")) {
    return "Free";
  }

  const match = summary.match(/£[\d.]+/);
  if (match) {
    return `From ${match[0]}`;
  }

  return `From ${formatMoney(getCustomerPriceForSession(session))}`;
}

export function getNextSessionLabel(session: ClubSession): string {
  return `${formatDay(session.day)} · ${formatTimeRange(session.startTime, session.endTime)}`;
}

export function getProviderName(session: ClubSession): string {
  return session.venue?.venueName || session.location || "Local provider";
}
