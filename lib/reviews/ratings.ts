import type {
  ActivityRatingSummary,
  ProviderRatingSummary,
  Review,
} from "./types";

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeSummary(
  reviews: Review[],
): Pick<ProviderRatingSummary, "averageRating" | "reviewCount" | "recommendPercent"> {
  if (reviews.length === 0) {
    return { averageRating: 0, reviewCount: 0, recommendPercent: 0 };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const recommendCount = reviews.filter((review) => review.recommend).length;

  return {
    averageRating: roundRating(totalRating / reviews.length),
    reviewCount: reviews.length,
    recommendPercent: Math.round((recommendCount / reviews.length) * 100),
  };
}

export function getProviderRatingSummary(
  providerId: string,
  reviews: Review[],
): ProviderRatingSummary {
  const published = reviews.filter(
    (review) =>
      review.providerId === providerId && review.status === "published",
  );

  return {
    providerId,
    ...computeSummary(published),
  };
}

export function getActivityRatingSummary(
  activityId: string,
  reviews: Review[],
): ActivityRatingSummary {
  const published = reviews.filter(
    (review) =>
      review.activityId === activityId && review.status === "published",
  );

  return {
    activityId,
    ...computeSummary(published),
  };
}

export function formatStarRating(rating: number): string {
  if (rating <= 0) return "—";
  return rating.toFixed(1);
}

export function renderStars(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
