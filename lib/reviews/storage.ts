import { canSubmitReview } from "./eligibility";
import { generateReviewTitle } from "./titles";
import { getCurrentUser } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getClubProfile } from "@/lib/club-profile";
import { getParentDisplayName } from "@/lib/parent-profile";
import { getSessionById } from "@/lib/sessions";
import type {
  Review,
  ReviewInput,
  ReviewReport,
  ReviewResponse,
  ReviewStatus,
} from "./types";

export const REVIEWS_STORAGE_KEY = "activora-reviews";
const REVIEWS_STORAGE_VERSION = 3;

type ReviewsState = {
  version?: number;
  reviews: Review[];
  responses: ReviewResponse[];
  reports: ReviewReport[];
};

type LegacyReview = Review & {
  body?: string;
  verifiedBooking?: boolean;
  activityTitle?: string;
  activityName?: string;
  status?: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function firstNameOnly(name: string): string {
  return name.trim().split(/\s+/)[0] || "Verified Parent";
}

function childFirstName(name?: string): string | undefined {
  if (!name) return undefined;
  return firstNameOnly(name);
}

function isDemoReview(review: LegacyReview): boolean {
  return (
    review.bookingId.startsWith("booking-demo-") ||
    review.id.startsWith("rev-") ||
    review.id.startsWith("demo-")
  );
}

function migrateStatus(status: string): ReviewStatus {
  if (status === "pending") return "pending_verification";
  if (status === "flagged") return "reported";
  if (status === "removed") return "hidden";
  if (
    status === "pending_verification" ||
    status === "published" ||
    status === "rejected" ||
    status === "reported" ||
    status === "hidden"
  ) {
    return status;
  }
  return "pending_verification";
}

function resolveSessionTitle(raw: LegacyReview): string {
  const direct =
    raw.sessionTitle?.trim() ||
    raw.activityTitle?.trim() ||
    raw.activityName?.trim() ||
    "";
  if (direct) return direct;

  if (raw.bookingId) {
    const booking = getBookingById(raw.bookingId);
    const session = booking ? getSessionById(booking.sessionId) : undefined;
    return session?.sessionTitle ?? booking?.sessionTitle ?? "";
  }

  return "";
}

function resolveVenueName(raw: LegacyReview): string | undefined {
  const direct = raw.venueName?.trim();
  if (direct) return direct;

  if (raw.bookingId) {
    const booking = getBookingById(raw.bookingId);
    const session = booking ? getSessionById(booking.sessionId) : undefined;
    return session?.venue?.venueName;
  }

  return undefined;
}

function migrateReview(raw: LegacyReview): Review {
  const booking = raw.bookingId ? getBookingById(raw.bookingId) : undefined;

  return {
    ...raw,
    comment: raw.comment ?? raw.body ?? "",
    verified: raw.verified ?? raw.verifiedBooking ?? false,
    helpfulCount: raw.helpfulCount ?? 0,
    reviewerFirstName: raw.reviewerFirstName ?? "Verified Parent",
    reviewerEmail: raw.reviewerEmail ?? booking?.email,
    sessionTitle: resolveSessionTitle(raw),
    venueName: resolveVenueName(raw),
    providerName: raw.providerName ?? booking?.providerName ?? "",
    dateAttended: raw.dateAttended ?? raw.createdAt.slice(0, 10),
    reviewSubmittedAt: raw.reviewSubmittedAt ?? raw.createdAt,
    status: migrateStatus(String(raw.status ?? "pending_verification")),
  };
}

function getDefaultState(): ReviewsState {
  return {
    version: REVIEWS_STORAGE_VERSION,
    reviews: [],
    responses: [],
    reports: [],
  };
}

export function getReviewsState(): ReviewsState {
  if (!isBrowser()) {
    return getDefaultState();
  }

  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultState();
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw) as ReviewsState;
    const rawReviews = parsed.reviews ?? [];
    const reviews = rawReviews
      .map((review) => migrateReview(review as LegacyReview))
      .filter((review) => !isDemoReview(review as LegacyReview));

    const needsPersist =
      (parsed.version ?? 1) < REVIEWS_STORAGE_VERSION ||
      reviews.length !== rawReviews.length ||
      reviews.some((review, index) => {
        const legacy = rawReviews[index] as LegacyReview;
        if (!legacy) return false;
        return (
          review.sessionTitle !== (legacy.sessionTitle?.trim() ?? "") ||
          review.venueName !== legacy.venueName?.trim() ||
          migrateStatus(String(legacy.status ?? "pending")) !==
            migrateStatus(String(legacy.status ?? "pending_verification"))
        );
      });

    const state: ReviewsState = {
      version: REVIEWS_STORAGE_VERSION,
      reviews,
      responses: parsed.responses ?? [],
      reports: parsed.reports ?? [],
    };

    if (needsPersist) {
      saveState(state);
    }

    return state;
  } catch {
    return getDefaultState();
  }
}

function saveState(state: ReviewsState): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(state));
}

export function getReviews(): Review[] {
  return getReviewsState().reviews;
}

export function getPublishedReviews(): Review[] {
  return getReviews().filter((review) => review.status === "published");
}

export function getReviewsForProvider(providerId: string): Review[] {
  return getReviews().filter((review) => review.providerId === providerId);
}

export function getPublishedReviewsForProvider(providerId: string): Review[] {
  return getReviewsForProvider(providerId).filter(
    (review) => review.status === "published",
  );
}

export function getReviewsForActivity(activityId: string): Review[] {
  return getPublishedReviews().filter(
    (review) => review.activityId === activityId,
  );
}

export function getReviewById(reviewId: string): Review | undefined {
  return getReviews().find((review) => review.id === reviewId);
}

export function getReviewByBookingId(bookingId: string): Review | undefined {
  return getReviews().find((review) => review.bookingId === bookingId);
}

export function getReviewResponses(reviewId?: string): ReviewResponse[] {
  const responses = getReviewsState().responses;
  if (!reviewId) return responses;
  return responses.filter((response) => response.reviewId === reviewId);
}

function buildReviewFromInput(input: ReviewInput): Omit<Review, "id" | "createdAt" | "status"> {
  const booking = getBookingById(input.bookingId);
  const profile = getClubProfile();
  const user = getCurrentUser();
  const parentName = booking?.parentName ?? getParentDisplayName();
  const anonymous = input.anonymous ?? false;
  const session = booking ? getSessionById(booking.sessionId) : undefined;

  return {
    rating: input.rating,
    comment: input.comment.trim(),
    recommend: input.recommend,
    title: generateReviewTitle(input.rating),
    reviewerFirstName: anonymous ? "Verified Parent" : firstNameOnly(parentName),
    reviewerEmail: booking?.email ?? user?.email,
    childName: childFirstName(booking?.childName),
    sessionTitle: session?.sessionTitle ?? booking?.sessionTitle ?? "Session",
    venueName: session?.venue?.venueName,
    providerName:
      booking?.providerName ?? profile?.clubName ?? "Activora Club",
    dateAttended: booking?.day
      ? booking.day.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    bookingId: input.bookingId,
    verified: true,
    helpfulCount: 0,
    anonymous,
    providerId: profile?.providerId ?? "local-provider",
    activityId: booking?.sessionId ?? "",
    parentId: user?.email ?? booking?.email ?? "parent-local",
    childId: booking?.childId,
    aiModerationStatus: "not_checked",
    suspiciousFlag: false,
    duplicateDetected: false,
    abusiveLanguageDetected: false,
  };
}

export function submitReview(input: ReviewInput): Review {
  const eligibility = canSubmitReview(input.bookingId, undefined);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? "Not eligible to submit review.");
  }

  const state = getReviewsState();
  const submittedAt = new Date().toISOString();
  const review: Review = {
    ...buildReviewFromInput(input),
    id: createId("rev"),
    status: "pending_verification",
    createdAt: submittedAt,
    reviewSubmittedAt: submittedAt,
  };

  state.reviews.push(review);
  saveState(state);
  return review;
}

export function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus,
): Review | null {
  const state = getReviewsState();
  const index = state.reviews.findIndex((review) => review.id === reviewId);
  if (index === -1) return null;

  state.reviews[index] = { ...state.reviews[index], status };
  saveState(state);
  return state.reviews[index];
}

export function verifyAndPublishReview(reviewId: string): Review | null {
  return updateReviewStatus(reviewId, "published");
}

export function rejectReview(reviewId: string): Review | null {
  return updateReviewStatus(reviewId, "rejected");
}

export function hideReview(reviewId: string): Review | null {
  return updateReviewStatus(reviewId, "hidden");
}

export function markReviewReported(reviewId: string): Review | null {
  const state = getReviewsState();
  const index = state.reviews.findIndex((review) => review.id === reviewId);
  if (index === -1) return null;

  state.reviews[index] = {
    ...state.reviews[index],
    status: "reported",
    suspiciousFlag: true,
  };
  saveState(state);
  return state.reviews[index];
}

export function requestReviewMoreInfo(reviewId: string): Review | null {
  const state = getReviewsState();
  const index = state.reviews.findIndex((review) => review.id === reviewId);
  if (index === -1) return null;

  state.reviews[index] = {
    ...state.reviews[index],
    infoRequestedAt: new Date().toISOString(),
  };
  saveState(state);
  return state.reviews[index];
}

export function updateReviewTitle(reviewId: string, title: string): Review | null {
  const state = getReviewsState();
  const index = state.reviews.findIndex((review) => review.id === reviewId);
  if (index === -1) return null;

  state.reviews[index] = {
    ...state.reviews[index],
    title: title.trim(),
  };
  saveState(state);
  return state.reviews[index];
}

export function incrementHelpfulCount(reviewId: string): Review | null {
  const state = getReviewsState();
  const index = state.reviews.findIndex((review) => review.id === reviewId);
  if (index === -1) return null;

  state.reviews[index] = {
    ...state.reviews[index],
    helpfulCount: state.reviews[index].helpfulCount + 1,
  };
  saveState(state);
  return state.reviews[index];
}

export function addReviewResponse(
  reviewId: string,
  providerId: string,
  body: string,
  respondedBy: string,
): ReviewResponse {
  const state = getReviewsState();
  const response: ReviewResponse = {
    id: createId("resp"),
    reviewId,
    providerId,
    body,
    respondedBy,
    createdAt: new Date().toISOString(),
  };

  state.responses.push(response);
  saveState(state);
  return response;
}

export function reportReview(
  reviewId: string,
  reportedBy: string,
  reason: string,
): ReviewReport {
  const state = getReviewsState();
  const report: ReviewReport = {
    id: createId("report"),
    reviewId,
    reportedBy,
    reason,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  state.reports.push(report);
  const reviewIndex = state.reviews.findIndex((r) => r.id === reviewId);
  if (reviewIndex !== -1) {
    state.reviews[reviewIndex] = {
      ...state.reviews[reviewIndex],
      status: "reported",
      suspiciousFlag: true,
    };
  }

  saveState(state);
  return report;
}

export function canReviewBooking(bookingId: string): boolean {
  return canSubmitReview(bookingId).eligible;
}
