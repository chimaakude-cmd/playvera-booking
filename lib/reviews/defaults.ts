import type { ClubReviewSettings } from "./types";

export const DEFAULT_CLUB_REVIEW_SETTINGS: ClubReviewSettings = {
  encourageReviews: true,
  incentiveType: "thank_you_email",
  autoRequestEnabled: true,
  requestDelay: "next_day",
  reminderDays: 7,
};
