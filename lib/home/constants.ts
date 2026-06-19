import {
  ACTIVITY_CATALOG,
  getActivitiesByPopularity,
} from "@/lib/home/activity-catalog";

/** Activora Premium Homepage design tokens */
export const ACTIVORA_PRIMARY = "#0F172A";
export const ACTIVORA_ACTION = "#F87128";
export const ACTIVORA_ACCENT = "#9333EA";
export const ACTIVORA_WARM = "#F87128";
export const ACTIVORA_BACKGROUND = "#F8FAFC";
export const ACTIVORA_GRADIENT = `linear-gradient(135deg, ${ACTIVORA_ACTION}, ${ACTIVORA_ACCENT})`;

/** @deprecated Use ACTIVORA_ACTION */
export const ACTIVORA_BLUE = ACTIVORA_ACTION;
/** @deprecated Use ACTIVORA_ACTION for CTAs */
export const ACTIVORA_ORANGE = ACTIVORA_ACTION;
export const ACTIVORA_NAVY = ACTIVORA_PRIMARY;

export { HOME_ACTIVITY_CATEGORIES } from "./category-images";

export const ACTIVITY_SUGGESTIONS = getActivitiesByPopularity()
  .slice(0, 16)
  .map(({ label, icon }) => ({ label, icon }));

/** @deprecated Use ACTIVITY_CATALOG from activity-catalog.ts */
export const ACTIVITY_CHIPS = ACTIVITY_CATALOG;

export const HERO_CAROUSEL = [
  {
    title: "Football",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=960&h=720&fit=crop&q=85",
  },
  {
    title: "Swimming",
    image:
      "https://images.unsplash.com/photo-1560743173-567a17423c44?w=960&h=720&fit=crop&q=85",
  },
  {
    title: "Holiday Camps",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=960&h=720&fit=crop&q=85",
  },
  {
    title: "Arts & Crafts",
    image:
      "https://images.unsplash.com/photo-1587735249884-0d490f726046?w=960&h=720&fit=crop&q=85",
  },
  {
    title: "Martial Arts",
    image:
      "https://images.unsplash.com/photo-1555597679-b057d270bf8e?w=960&h=720&fit=crop&q=85",
  },
  {
    title: "Performing Arts",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b864686f66?w=960&h=720&fit=crop&q=85",
  },
] as const;

export const HERO_TRUST_SIGNALS = [
  { key: "verified", icon: "badge" },
  { key: "payments", icon: "shield" },
  { key: "refunds", icon: "refund" },
  { key: "support", icon: "support" },
] as const;

export const TRUST_STATS = [
  { value: "★★★★★", label: "Parent rating" },
  { value: "12,000+", label: "Bookings" },
  { value: "200+", label: "Providers" },
  { value: "99.9%", label: "Uptime" },
] as const;

export const POPULAR_CLUBS = [
  {
    name: "Soccer HQ",
    rating: 4.8,
    ages: "Ages 6–12",
    distance: "2.1 miles",
    price: "£8",
    verified: true,
    spacesLeft: 3,
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=640&h=440&fit=crop&q=85",
  },
  {
    name: "Rhythm Dance Academy",
    rating: 4.9,
    ages: "Ages 5–14",
    distance: "3.2 miles",
    price: "£10",
    verified: true,
    spacesLeft: 3,
    image:
      "https://images.unsplash.com/photo-1518834107812-67b864686f66?w=640&h=440&fit=crop&q=85",
  },
  {
    name: "Splash Swim School",
    rating: 4.7,
    ages: "Ages 3–10",
    distance: "4.5 miles",
    price: "£12",
    verified: true,
    spacesLeft: 2,
    image:
      "https://images.unsplash.com/photo-1560743173-567a17423c44?w=640&h=440&fit=crop&q=85",
  },
  {
    name: "GymStars",
    rating: 4.6,
    ages: "Ages 4–11",
    distance: "3.8 miles",
    price: "£9",
    verified: false,
    spacesLeft: 5,
    image:
      "https://images.unsplash.com/photo-1555597679-b057d270bf8e?w=640&h=440&fit=crop&q=85",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Search",
    description: "Find clubs, camps and activities near you.",
    icon: "🔍",
  },
  {
    step: 2,
    title: "Book",
    description: "Choose a session and pay securely online.",
    icon: "📅",
  },
  {
    step: 3,
    title: "Attend",
    description: "Your child turns up, learns and has fun.",
    icon: "✅",
  },
  {
    step: 4,
    title: "Leave review",
    description: "Share feedback to help other families.",
    icon: "⭐",
  },
] as const;

export const PROVIDER_BENEFITS = [
  "No monthly fees",
  "Bookings online",
  "Digital registers",
  "Automated comms",
  "Stripe + GoCardless",
  "Bug reporting",
  "Demo support",
  "Roadmap voting",
  "Live updates",
] as const;

export const HERO_IMAGE = HERO_CAROUSEL[0].image;

export const PROVIDER_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&h=500&fit=crop&q=80";
