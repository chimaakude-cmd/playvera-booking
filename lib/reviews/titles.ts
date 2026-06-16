const RATING_TITLES: Record<number, string> = {
  5: "Fantastic experience",
  4: "Great session overall",
  3: "Enjoyable but room to improve",
  2: "Mixed experience",
  1: "Needs improvement",
};

export function generateReviewTitle(rating: number): string {
  const clamped = Math.min(5, Math.max(1, Math.round(rating)));
  return RATING_TITLES[clamped] ?? RATING_TITLES[3];
}
