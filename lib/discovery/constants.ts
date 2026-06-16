import type { HomeSearchFilters } from "@/lib/home/search-url";

export const SAVED_SESSIONS_KEY = "activora-saved-sessions";
export const SAVED_FILTERS_KEY = "activora-discovery-filters";

/** Discovery page border-radius tokens */
export const DISCOVERY_RADIUS = {
  card: "rounded-[32px]",
  input: "rounded-[20px]",
  button: "rounded-[18px]",
  map: "rounded-[32px]",
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

export const DISCOVERY_CATEGORY_BADGES = [
  { label: "Trending now", icon: "🔥", query: "" },
  { label: "Summer camps", icon: "☀️", query: "camps" },
  { label: "Most booked", icon: "⭐", query: "" },
  { label: "Near you", icon: "📍", query: "" },
] as const;

export const DISCOVERY_CATEGORY_CARDS = [
  {
    label: "Football",
    icon: "⚽",
    query: "Football",
    count: 1248,
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Swimming",
    icon: "🏊",
    query: "Swimming",
    count: 892,
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Arts",
    icon: "🎨",
    query: "arts",
    count: 634,
    image:
      "https://images.unsplash.com/photo-1460661419371-ef9473adf5b6?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Drama",
    icon: "🎭",
    query: "drama",
    count: 421,
    image:
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Holiday Camps",
    icon: "🏕",
    query: "camps",
    count: 756,
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Wraparound",
    icon: "🌅",
    query: "wraparound",
    count: 312,
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Tutoring",
    icon: "📚",
    query: "tutoring",
    count: 528,
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Martial Arts",
    icon: "🥋",
    query: "martial arts",
    count: 389,
    image:
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=440&h=280&fit=crop&q=80",
  },
  {
    label: "Early Years",
    icon: "🧸",
    query: "early years",
    count: 445,
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=440&h=280&fit=crop&q=80",
  },
] as const;

/** @deprecated Use DISCOVERY_CATEGORY_CARDS */
export const DISCOVERY_CATEGORY_CHIPS = DISCOVERY_CATEGORY_CARDS.map(
  ({ label, icon, query }) => ({ label, icon, query }),
);

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

export const DISCOVERY_TRUST_STATS = [
  { value: "★★★★★", label: "Parent rating" },
  { value: "12,000+", label: "Bookings made" },
  { value: "200+", label: "Verified providers" },
  { value: "Secure", label: "Online payments" },
] as const;
