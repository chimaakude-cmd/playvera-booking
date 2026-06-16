import {
  ACTIVITY_CATALOG,
  getActivitiesByPopularity,
} from "@/lib/home/activity-catalog";

/** Activora Premium Homepage design tokens */
export const ACTIVORA_PRIMARY = "#0F172A";
export const ACTIVORA_ACTION = "#2563EB";
export const ACTIVORA_ACCENT = "#14B8A6";
export const ACTIVORA_BACKGROUND = "#F8FAFC";

/** @deprecated Use ACTIVORA_ACTION */
export const ACTIVORA_BLUE = ACTIVORA_ACTION;
/** @deprecated Use ACTIVORA_ACTION for CTAs */
export const ACTIVORA_ORANGE = ACTIVORA_ACTION;
export const ACTIVORA_NAVY = ACTIVORA_PRIMARY;

export const ACTIVITY_SUGGESTIONS = getActivitiesByPopularity()
  .slice(0, 16)
  .map(({ label, icon }) => ({ label, icon }));

/** @deprecated Use ACTIVITY_CATALOG from activity-catalog.ts */
export const ACTIVITY_CHIPS = ACTIVITY_CATALOG;

export const HERO_CAROUSEL = [
  {
    title: "Football",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&h=650&fit=crop&q=80",
  },
  {
    title: "Swimming",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&h=650&fit=crop&q=80",
  },
  {
    title: "Dance",
    image:
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=900&h=650&fit=crop&q=80",
  },
  {
    title: "Wraparound",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&h=650&fit=crop&q=80",
  },
  {
    title: "Holiday Camps",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=650&fit=crop&q=80",
  },
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
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop&q=80",
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
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=400&fit=crop&q=80",
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
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=400&fit=crop&q=80",
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
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop&q=80",
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
