import type { Release, ReleaseSettings } from "./types";

export const RELEASES_KEY = "activora-releases";
export const RELEASE_SETTINGS_KEY = "activora-releases-settings";

export const DEFAULT_RELEASE_SETTINGS: ReleaseSettings = {
  autoGenerateReleaseNotes: true,
};

export const SEED_RELEASES: Release[] = [
  {
    id: "rel_v05",
    title: "Activora 0.5 — Foundation release",
    description:
      "Core platform launch with club onboarding, attendance registers, website widget, partnerships, and public bug reporting.",
    type: "feature",
    version: "0.5",
    releaseDate: "2026-06-01T09:00:00.000Z",
    summary:
      "The foundation release for clubs, parents and platform transparency.",
    details: [
      "Club onboarding wizard — guided setup from profile to first session",
      "Attendance registers — digital roll call with session history",
      "Website booking widget — embed sessions on your club website",
      "Partnerships programme — enquiry flow for schools and organisations",
      "Public bug reporting — report issues directly from the platform",
      "Platform transparency pages — status, security, accessibility and updates",
      "Stripe Connect payments — secure checkout for families",
      "Support launcher — in-app help and demo booking",
    ],
    status: "published",
    scheduledAt: null,
    publishedAt: "2026-06-01T09:00:00.000Z",
    createdAt: "2026-05-15T10:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "rel_v04_perf",
    title: "Session search performance",
    description: "Faster homepage and session directory loading.",
    type: "performance",
    version: "0.4",
    releaseDate: "2026-05-10T12:00:00.000Z",
    summary: "Improved search and map rendering for popular areas.",
    details: [
      "Reduced initial bundle size for session cards",
      "Cached geolocation radius queries",
      "Optimised hero image loading on mobile",
    ],
    status: "published",
    scheduledAt: null,
    publishedAt: "2026-05-10T12:00:00.000Z",
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-10T12:00:00.000Z",
  },
  {
    id: "rel_v04_fix",
    title: "Booking confirmation emails",
    description: "Fixed duplicate confirmation emails on retry.",
    type: "fix",
    version: "0.4",
    releaseDate: "2026-04-22T16:00:00.000Z",
    summary: "Parents no longer receive duplicate emails when refreshing checkout.",
    details: [
      "Idempotent email dispatch on payment success",
      "Clearer error state when email delivery is delayed",
    ],
    status: "published",
    scheduledAt: null,
    publishedAt: "2026-04-22T16:00:00.000Z",
    createdAt: "2026-04-15T10:00:00.000Z",
    updatedAt: "2026-04-22T16:00:00.000Z",
  },
];
