import { getCurrentUser } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { validateBookingEligibility } from "./booking-proof";
import { getReviews } from "./storage";
import type { ReviewEligibility } from "./types";

export const REVIEW_ELIGIBILITY_KEY = "activora-review-eligibility";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getEligibilityOverrides(): Record<string, ReviewEligibility> {
  if (!isBrowser()) return {};

  try {
    const raw = localStorage.getItem(REVIEW_ELIGIBILITY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ReviewEligibility>) : {};
  } catch {
    return {};
  }
}

export function saveEligibilityOverride(eligibility: ReviewEligibility): void {
  if (!isBrowser()) return;

  const overrides = getEligibilityOverrides();
  overrides[eligibility.bookingId] = eligibility;
  localStorage.setItem(REVIEW_ELIGIBILITY_KEY, JSON.stringify(overrides));
}

export function setAdminEligibilityOverride(
  bookingId: string,
  childId: string,
  sessionBlockId: string,
  eligible: boolean,
): void {
  saveEligibilityOverride({
    bookingId,
    childId,
    sessionBlockId,
    eligible,
    adminOverride: true,
    reason: eligible ? "Admin override — eligible" : "Admin override — blocked",
  });
}

function isParentAccountActive(): boolean {
  const user = getCurrentUser();
  return user?.role === "parent" || Boolean(user?.email);
}

function hasExistingReviewForChildAndBlock(
  childId: string,
  sessionBlockId: string,
): boolean {
  return getReviews().some(
    (review) =>
      review.childId === childId &&
      review.activityId === sessionBlockId &&
      review.status !== "hidden" &&
      review.status !== "rejected",
  );
}

export type EligibilityResult = {
  eligible: boolean;
  reason?: string;
  sessionBlockId?: string;
  childId?: string;
};

export function canSubmitReview(
  bookingId: string,
  childId?: string,
): EligibilityResult {
  const overrides = getEligibilityOverrides();
  const override = overrides[bookingId];

  if (override?.adminOverride) {
    return {
      eligible: override.eligible,
      reason: override.reason,
      sessionBlockId: override.sessionBlockId,
      childId: override.childId,
    };
  }

  const bookingCheck = validateBookingEligibility(bookingId);
  if (!bookingCheck.eligible) {
    return {
      eligible: false,
      reason: bookingCheck.reason,
      sessionBlockId: bookingCheck.sessionId,
      childId: bookingCheck.childId,
    };
  }

  const booking = getBookingById(bookingId);
  if (!booking) {
    return { eligible: false, reason: bookingCheck.reason };
  }

  const resolvedChildId = childId ?? booking.childId ?? booking.id;
  const sessionBlockId = booking.sessionId;

  if (!isParentAccountActive()) {
    return {
      eligible: false,
      reason: "Parent account must be active to leave a review.",
      sessionBlockId,
      childId: resolvedChildId,
    };
  }

  if (hasExistingReviewForChildAndBlock(resolvedChildId, sessionBlockId)) {
    return {
      eligible: false,
      reason: "You have already reviewed this session block for this child.",
      sessionBlockId,
      childId: resolvedChildId,
    };
  }

  const existingForBooking = getReviews().find((r) => r.bookingId === bookingId);
  if (existingForBooking) {
    return {
      eligible: false,
      reason: "A review already exists for this booking.",
      sessionBlockId,
      childId: resolvedChildId,
    };
  }

  return { eligible: true, sessionBlockId, childId: resolvedChildId };
}

export function buildEligibilityRecord(
  bookingId: string,
  childId?: string,
): ReviewEligibility {
  const result = canSubmitReview(bookingId, childId);
  return {
    bookingId,
    childId: result.childId ?? childId ?? bookingId,
    sessionBlockId: result.sessionBlockId ?? "",
    eligible: result.eligible,
    reason: result.reason,
  };
}
