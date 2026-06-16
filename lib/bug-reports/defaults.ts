import type { BugReport, BugReportNote } from "./types";

export const BUG_REPORTS_KEY = "activora-bug-reports";
export const BUG_REPORT_NOTES_KEY = "activora-bug-report-notes";
export const BUG_REPORTS_DEMO_PURGE_KEY = "activora-bug-reports-demo-purged";

/** Max data-URL screenshot size stored in localStorage (bytes). */
export const MAX_SCREENSHOT_DATA_URL_BYTES = 500_000;

/** Legacy demo bug report IDs removed from admin inbox (pre-real-data seed). */
export const LEGACY_DEMO_BUG_REPORT_IDS = new Set([
  "bug_demo_001",
  "bug_demo_002",
]);

/** Legacy demo note IDs removed with demo bug reports. */
export const LEGACY_DEMO_BUG_NOTE_IDS = new Set([
  "note_demo_001",
  "note_demo_002",
]);

/** Empty initial storage — real reports from /report-bug only, no demo rows. */
export const SEED_BUG_REPORTS: BugReport[] = [];

export const SEED_BUG_REPORT_NOTES: BugReportNote[] = [];
