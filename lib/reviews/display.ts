/**
 * Public display helpers for verified reviews.
 * Never expose child identity or provider name in these formatters.
 */

import type { Review } from "./types";

export function formatSessionAttended(
  sessionTitle?: string | null,
  venueName?: string | null,
): string {
  const title = sessionTitle?.trim();
  if (!title) {
    return "Verified activity";
  }

  const venue = venueName?.trim();
  if (venue) {
    return `${title} — ${venue}`;
  }

  return title;
}

export function formatDateAttended(date: string): string {
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

export function getReviewSubmittedAt(
  review: Pick<Review, "reviewSubmittedAt" | "createdAt">,
): string {
  return review.reviewSubmittedAt ?? review.createdAt;
}

export function getReviewAgeTooltip(reviewSubmittedAt: string): string {
  return formatDateAttended(reviewSubmittedAt);
}

/**
 * Relative review age for public cards.
 * < 7 days → days; < 5 weeks → weeks; < 12 months → months; 12+ → years.
 */
export function formatReviewAge(
  reviewSubmittedAt: string,
  now: Date = new Date(),
): string {
  const submitted = new Date(reviewSubmittedAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfSubmitted = new Date(
    submitted.getFullYear(),
    submitted.getMonth(),
    submitted.getDate(),
  );
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfSubmitted.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "Reviewed today";
  if (diffDays === 1) return "Reviewed yesterday";
  if (diffDays < 7) return `Reviewed ${diffDays} days ago`;

  if (diffDays < 35) {
    const weeks = Math.floor(diffDays / 7);
    return `Reviewed ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  let months =
    (now.getFullYear() - submitted.getFullYear()) * 12 +
    (now.getMonth() - submitted.getMonth());
  if (now.getDate() < submitted.getDate()) {
    months -= 1;
  }
  months = Math.max(1, months);

  if (months < 12) {
    return `Reviewed ${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(months / 12);
  return `Reviewed ${years} year${years === 1 ? "" : "s"} ago`;
}
