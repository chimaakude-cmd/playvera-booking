import type { HomeSearchFilters } from "@/lib/home/search-url";
import { HOME_ACTIVITY_CATEGORIES } from "@/lib/home/category-images";

export const SAVED_SESSIONS_KEY = "activora-saved-sessions";
export const SAVED_FILTERS_KEY = "activora-discovery-filters";

/** Discovery page border-radius tokens */
export const DISCOVERY_RADIUS = {
  card: "rounded-[32px]",
  input: "rounded-[20px]",
  button: "rounded-[18px]",
  map: "rounded-[36px]",
  searchPill: "rounded-full",
  category: "rounded-[28px]",
  sessionCard: "rounded-[32px]",
} as const;

export const DISCOVERY_TRUST_OVERLAY = [
  "Secure checkout",
  "DBS checked",
  "Refund policy",
  "Instant confirmation",
] as const;


/** @deprecated Use HOME_ACTIVITY_CATEGORIES from lib/home/category-images.ts */
export const DISCOVERY_CATEGORY_CARDS = HOME_ACTIVITY_CATEGORIES.map(
  (category) => ({
    ...category,
    count: 0,
  }),
);

/** Image category cards for discovery — aligned with homepage catalog. */
export const POPULAR_CATEGORIES = HOME_ACTIVITY_CATEGORIES;

/** @deprecated Use DISCOVERY_CATEGORY_CARDS */
export const DISCOVERY_CATEGORY_CHIPS = DISCOVERY_CATEGORY_CARDS.map(
  ({ label, icon, query }) => ({ label, icon, query }),
);

/** Chip labels/icons aligned with homepage activity catalog — see lib/home/activity-catalog.ts */
export {
  ACTIVITY_CATALOG,
  getActivitiesByPopularity,
  filterActivities,
} from "@/lib/home/activity-catalog";

export const SMART_SEARCH_SUGGESTIONS = [
  { label: "Football", icon: "⚽" },
  { label: "Futsal", icon: "⚽" },
  { label: "Swimming", icon: "🏊" },
  { label: "Swim lessons", icon: "🏊" },
  { label: "Drama", icon: "🎭" },
  { label: "Performing arts", icon: "🎭" },
  { label: "Arts & crafts", icon: "🎨" },
  { label: "Holiday camps", icon: "🏕" },
  { label: "Martial arts", icon: "🥋" },
  { label: "Karate", icon: "🥋" },
  { label: "Gymnastics", icon: "🤸" },
  { label: "Dance", icon: "💃" },
  { label: "Tennis", icon: "🎾" },
  { label: "Rugby", icon: "🏉" },
  { label: "Early years", icon: "🧸" },
  { label: "Education", icon: "📚" },
] as const;

export const SORT_OPTIONS = [
  { value: "nearest", label: "Nearest" },
  { value: "rating", label: "Highest Rated" },
  { value: "price", label: "Price" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export type ViewMode = "split";

export const SAVE_LISTS = [
  "Summer camps",
  "Swimming",
  "Birthday ideas",
  "Favourites",
] as const;

export type SaveListName = (typeof SAVE_LISTS)[number];

export const DEFAULT_DISCOVERY_FILTERS: HomeSearchFilters = {
  location: "",
  childAge: "",
  radius: "10",
  activity: "",
  date: "",
};

/** @deprecated Use DISCOVERY_TRUST_SIGNALS */
export const DISCOVERY_TRUST_STATS = [
  { value: "★★★★★", label: "Parent rating" },
  { value: "12,000+", label: "Bookings made" },
  { value: "200+", label: "Verified providers" },
  { value: "Secure", label: "Online payments" },
] as const;

export const DISCOVERY_TRUST_SIGNALS = [
  { icon: "verified" as const, label: "Verified providers" },
  { icon: "instant" as const, label: "Instant booking" },
  { icon: "secure" as const, label: "Secure payments" },
] as const;

/** Large visual cards shown when search returns no results */
export const EMPTY_RECOMMENDATION_CARDS = [
  {
    id: "popular-near-you",
    title: "Popular near you",
    description: "Top-rated clubs families book every week.",
    query: "Football",
    icon: "📍",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=640&h=400&fit=crop&q=80",
  },
  {
    id: "similar-age",
    title: "Similar age range",
    description: "Activities matched to your child's age group.",
    query: "early years",
    icon: "🧸",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=640&h=400&fit=crop&q=80",
  },
  {
    id: "trending-week",
    title: "Trending this week",
    description: "The fastest-growing sessions parents love.",
    query: "Swimming",
    icon: "🔥",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=640&h=400&fit=crop&q=80",
  },
  {
    id: "online",
    title: "Online activities",
    description: "Live tutoring and creative workshops from home.",
    query: "tutoring",
    icon: "💻",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&h=400&fit=crop&q=80",
  },
] as const;
