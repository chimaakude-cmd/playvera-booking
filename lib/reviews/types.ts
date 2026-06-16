/**
 * Verified review system v2 — types and business rules.
 *
 * Rules:
 * - Only parents who booked AND attended a session may submit a review.
 * - Each review links to a real bookingId; verified when attendance is confirmed.
 * - Parents submit: stars, comment, recommend yes/no. Title is auto-generated.
 * - One review per child per session block.
 *
 * Storage keys:
 * - activora-reviews
 * - activora-club-review-settings
 * - activora-review-requests
 * - activora-review-eligibility
 *
 * Database: migrations 00016_reviews.sql, 00025_reviews_v2.sql
 */

export type ReviewStatus = "published" | "pending" | "reported" | "hidden";

export type AiModerationStatus =
  | "not_checked"
  | "approved"
  | "flagged"
  | "rejected";

export type Review = {
  id: string;
  rating: number;
  comment: string;
  recommend: boolean;
  title: string;
  /** Internal — not shown on public review cards */
  reviewerFirstName?: string;
  /** Internal — never shown publicly */
  childName?: string;
  /** Required for public display */
  sessionTitle: string;
  /** Optional venue line for public display */
  venueName?: string;
  /** Internal only — eligibility and admin; not shown on public cards */
  dateAttended: string;
  /** ISO timestamp when the review was submitted — used for public age display */
  reviewSubmittedAt?: string;
  /** Internal — not shown on public review cards */
  providerName?: string;
  /** Internal — not shown on public review cards */
  bookingId: string;
  verified: boolean;
  helpfulCount: number;
  createdAt: string;
  status: ReviewStatus;
  providerId: string;
  activityId: string;
  parentId: string;
  childId?: string;
  anonymous?: boolean;
  adminOverride?: boolean;
  suspiciousFlag?: boolean;
  aiModerationStatus?: AiModerationStatus;
  duplicateDetected?: boolean;
  abusiveLanguageDetected?: boolean;
};

export type ReviewEligibility = {
  bookingId: string;
  childId: string;
  sessionBlockId: string;
  eligible: boolean;
  reason?: string;
  adminOverride?: boolean;
};

export type ClubReviewSettings = {
  encourageReviews: boolean;
  incentiveType:
    | "thank_you_email"
    | "priority_booking"
    | "club_points"
    | "discount"
    | "none";
  autoRequestEnabled: boolean;
  requestDelay: "same_day" | "next_day" | "end_of_block";
  reminderDays: 3 | 7 | null;
};

export type ReviewResponse = {
  id: string;
  reviewId: string;
  providerId: string;
  body: string;
  respondedBy: string;
  createdAt: string;
};

export type ReviewReport = {
  id: string;
  reviewId: string;
  reportedBy: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
};

export type ReviewRequestStatus = "scheduled" | "sent" | "cancelled";

export type ReviewRequest = {
  id: string;
  bookingId: string;
  childId: string;
  parentEmail: string;
  parentName: string;
  sessionTitle: string;
  providerName: string;
  scheduledFor: string;
  sentAt?: string;
  status: ReviewRequestStatus;
  reminderScheduledFor?: string;
  reviewLink: string;
};

export type ReviewInput = {
  bookingId: string;
  rating: number;
  comment: string;
  recommend: boolean;
  anonymous?: boolean;
};

export type ProviderRatingSummary = {
  providerId: string;
  averageRating: number;
  reviewCount: number;
  recommendPercent: number;
};

export type ActivityRatingSummary = {
  activityId: string;
  averageRating: number;
  reviewCount: number;
  recommendPercent: number;
};

export type ReviewInsights = {
  averageRating: number;
  responseRate: number;
  conversionPercent: number;
  recentKeywords: string[];
  totalReviews: number;
  publishedReviews: number;
};
