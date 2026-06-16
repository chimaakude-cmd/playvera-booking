import type { BugReport, BugReportNote } from "./types";

export const BUG_REPORTS_KEY = "activora-bug-reports";
export const BUG_REPORT_NOTES_KEY = "activora-bug-report-notes";

/** Max data-URL screenshot size stored in localStorage (bytes). */
export const MAX_SCREENSHOT_DATA_URL_BYTES = 500_000;

export const SEED_BUG_REPORTS: BugReport[] = [
  {
    id: "bug_demo_001",
    reporterName: "Sarah Mitchell",
    reporterEmail: "sarah@example.com",
    accountType: "parent",
    pageUrl: "/parent/bookings",
    description: "Booking confirmation page shows the wrong session time after checkout.",
    stepsToReproduce:
      "1. Book a session for Saturday 10am\n2. Complete payment\n3. View confirmation — shows 2pm instead",
    screenshotUrl: null,
    priority: "high",
    consentGiven: true,
    deviceInfo: {
      browser: "Chrome 122",
      device: "Windows desktop",
      screenSize: "1920×1080",
    },
    status: "investigating",
    assignedAdminId: "admin_demo_001",
    assignedAdminName: "Support Admin",
    createdAt: "2026-06-10T09:15:00.000Z",
    updatedAt: "2026-06-11T14:30:00.000Z",
  },
  {
    id: "bug_demo_002",
    reporterName: "Riverside FC",
    reporterEmail: "club@test.activeora.co.uk",
    accountType: "club",
    pageUrl: "/club/sessions",
    description: "Session list filter resets when navigating back from edit page.",
    stepsToReproduce:
      "1. Filter sessions by Football\n2. Open a session to edit\n3. Click back — filter is cleared",
    screenshotUrl: null,
    priority: "normal",
    consentGiven: true,
    deviceInfo: {
      browser: "Safari 17",
      device: "iPad",
      screenSize: "1024×768",
    },
    status: "new",
    assignedAdminId: null,
    assignedAdminName: null,
    createdAt: "2026-06-14T16:45:00.000Z",
    updatedAt: "2026-06-14T16:45:00.000Z",
  },
];

export const SEED_BUG_REPORT_NOTES: BugReportNote[] = [
  {
    id: "note_demo_001",
    bugReportId: "bug_demo_001",
    authorId: "admin_demo_001",
    authorName: "Support Admin",
    body: "Reproduced on staging — timezone offset issue in confirmation template.",
    noteType: "internal",
    createdAt: "2026-06-11T10:00:00.000Z",
  },
  {
    id: "note_demo_002",
    bugReportId: "bug_demo_001",
    authorId: "admin_demo_001",
    authorName: "Support Admin",
    body: "Status changed to Investigating",
    noteType: "status_change",
    statusFrom: "new",
    statusTo: "investigating",
    createdAt: "2026-06-11T14:30:00.000Z",
  },
];
