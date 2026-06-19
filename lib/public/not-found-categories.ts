import { HOME_ACTIVITY_CATEGORIES } from "@/lib/home/category-images";

export const PUBLIC_NOT_FOUND_CATEGORIES = [
  "Football",
  "Swimming",
  "Arts & Crafts",
  "Drama",
  "Holiday Camps",
  "Wraparound Care",
] as const;

export const publicNotFoundCategoryCards = HOME_ACTIVITY_CATEGORIES.filter(
  (category) =>
    PUBLIC_NOT_FOUND_CATEGORIES.includes(
      category.label as (typeof PUBLIC_NOT_FOUND_CATEGORIES)[number],
    ),
);
