import type { PlatformStatusSnapshot } from "./types";

export const PLATFORM_STATUS_KEY = "activora-platform-status";

export const DEMO_PLATFORM_STATUS: PlatformStatusSnapshot = {
  overall: "operational",
  uptimePercent: 99.97,
  responseTimeMs: 142,
  lastIncident: "2026-05-28T14:30:00.000Z",
  updatedAt: new Date().toISOString(),
  components: [
    { id: "website", name: "Website", health: "operational" },
    { id: "bookings", name: "Bookings", health: "operational" },
    { id: "payments", name: "Payments", health: "operational" },
    { id: "email", name: "Email", health: "operational" },
    { id: "notifications", name: "Notifications", health: "operational" },
    { id: "admin_dashboard", name: "Admin Dashboard", health: "operational" },
    {
      id: "provider_dashboard",
      name: "Provider Dashboard",
      health: "operational",
    },
    { id: "parent_dashboard", name: "Parent Dashboard", health: "operational" },
  ],
  incidents: [
    {
      id: "inc_001",
      date: "2026-05-28T14:30:00.000Z",
      issue: "Intermittent delays on booking confirmation emails",
      resolution:
        "Email queue backlog cleared; monitoring delivery latency for 48 hours.",
      status: "resolved",
    },
    {
      id: "inc_002",
      date: "2026-04-12T09:15:00.000Z",
      issue: "Stripe webhook processing delayed by up to 3 minutes",
      resolution:
        "Scaled webhook workers; added retry alerts for payment reconciliation.",
      status: "resolved",
    },
    {
      id: "inc_003",
      date: "2026-03-03T18:45:00.000Z",
      issue: "Provider dashboard slow to load session registers",
      resolution:
        "Optimised register queries; deployed caching layer for attendance data.",
      status: "resolved",
    },
  ],
};
