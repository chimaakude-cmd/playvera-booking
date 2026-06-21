/**
 * Club share centre — types and storage keys.
 *
 * Storage (today): localStorage
 * Database (migration): public.share_events, public.share_metrics
 */

export const SHARE_EVENTS_STORAGE_KEY = "activora-club-share-events";
export const SHARE_METRICS_STORAGE_KEY = "activora-club-share-metrics";

export type ShareEventType =
  | "qr_scan"
  | "link_click"
  | "social_share"
  | "profile_visit"
  | "booking_from_share";

export type SharePlatform =
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "x"
  | "email"
  | "linkedin"
  | "messenger"
  | "telegram"
  | "sms"
  | "copy_link"
  | "more"
  | "pinterest"
  | "reddit"
  | "nextdoor"
  | "teams"
  | "slack";

export type ShareEventSource =
  | "public_profile"
  | "public_widget"
  | "public_booking"
  | "club_dashboard"
  | "unknown";

export type ShareEvent = {
  id: string;
  type: ShareEventType;
  platform?: SharePlatform;
  timestamp: string;
  /** False for internal/preview traffic and legacy dashboard copy actions. */
  isPublic?: boolean;
  source?: ShareEventSource;
};

export type ShareMetrics = {
  profileVisits: number;
  qrScans: number;
  linkClicks: number;
  bookingsFromShares: number;
  topPlatform: SharePlatform | null;
};

export type EmbedType = "mini_card" | "activity_widget" | "book_now";

export type ShareContent = {
  title: string;
  body: string;
  link: string;
};

export type EmbedOption = {
  type: EmbedType;
  label: string;
  description: string;
  height: number;
};

export const EMBED_OPTIONS: EmbedOption[] = [
  {
    type: "mini_card",
    label: "Mini card",
    description: "Compact club card for sidebars and footers.",
    height: 320,
  },
  {
    type: "activity_widget",
    label: "Activity widget",
    description: "Full list of bookable activities.",
    height: 700,
  },
  {
    type: "book_now",
    label: "Book now button",
    description: "Single call-to-action button.",
    height: 120,
  },
];
