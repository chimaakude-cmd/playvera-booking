import { isDataUrl, toPersistableImageUrl } from "@/lib/image-urls";
import {
  BUG_REPORT_NOTES_KEY,
  BUG_REPORTS_KEY,
  MAX_SCREENSHOT_DATA_URL_BYTES,
  SEED_BUG_REPORT_NOTES,
  SEED_BUG_REPORTS,
} from "./defaults";
import type {
  BugReport,
  BugReportNote,
  BugReportStatus,
  CreateBugReportInput,
} from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeded(): void {
  if (!isBrowser()) {
    return;
  }
  if (!localStorage.getItem(BUG_REPORTS_KEY)) {
    writeJson(BUG_REPORTS_KEY, SEED_BUG_REPORTS);
    writeJson(BUG_REPORT_NOTES_KEY, SEED_BUG_REPORT_NOTES);
  }
}

/** Persist screenshot as data URL if under size limit, else http(s) URL or null. */
export function sanitizeScreenshotUrl(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  const httpUrl = toPersistableImageUrl(value);
  if (httpUrl) {
    return httpUrl;
  }
  if (isDataUrl(value) && value.length <= MAX_SCREENSHOT_DATA_URL_BYTES) {
    return value;
  }
  return null;
}

export function getBugReports(): BugReport[] {
  ensureSeeded();
  const reports = readJson<BugReport[]>(BUG_REPORTS_KEY, []);
  return [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getBugReportById(id: string): BugReport | null {
  return getBugReports().find((report) => report.id === id) ?? null;
}

export function createBugReport(input: CreateBugReportInput): BugReport {
  ensureSeeded();
  const reports = readJson<BugReport[]>(BUG_REPORTS_KEY, []);
  const now = nowIso();
  const report: BugReport = {
    id: createId("bug"),
    reporterName: input.reporterName.trim(),
    reporterEmail: input.reporterEmail.trim(),
    accountType: input.accountType,
    pageUrl: input.pageUrl.trim(),
    description: input.description.trim(),
    stepsToReproduce: input.stepsToReproduce.trim(),
    screenshotUrl: sanitizeScreenshotUrl(input.screenshotUrl),
    priority: input.priority,
    consentGiven: input.consentGiven,
    deviceInfo: input.deviceInfo,
    status: "new",
    assignedAdminId: null,
    assignedAdminName: null,
    createdAt: now,
    updatedAt: now,
  };
  writeJson(BUG_REPORTS_KEY, [report, ...reports]);
  return report;
}

export function updateBugReportStatus(
  id: string,
  status: BugReportStatus,
  authorId: string,
  authorName: string,
): BugReport | null {
  ensureSeeded();
  const reports = readJson<BugReport[]>(BUG_REPORTS_KEY, []);
  const index = reports.findIndex((report) => report.id === id);
  if (index === -1) {
    return null;
  }
  const previous = reports[index];
  const updated: BugReport = {
    ...previous,
    status,
    updatedAt: nowIso(),
  };
  reports[index] = updated;
  writeJson(BUG_REPORTS_KEY, reports);
  addBugReportNote({
    bugReportId: id,
    authorId,
    authorName,
    body: `Status changed to ${status.replace(/_/g, " ")}`,
    noteType: "status_change",
    statusFrom: previous.status,
    statusTo: status,
  });
  return updated;
}

export function assignBugReport(
  id: string,
  adminId: string,
  adminName: string,
): BugReport | null {
  ensureSeeded();
  const reports = readJson<BugReport[]>(BUG_REPORTS_KEY, []);
  const index = reports.findIndex((report) => report.id === id);
  if (index === -1) {
    return null;
  }
  const updated: BugReport = {
    ...reports[index],
    assignedAdminId: adminId,
    assignedAdminName: adminName,
    updatedAt: nowIso(),
  };
  reports[index] = updated;
  writeJson(BUG_REPORTS_KEY, reports);
  return updated;
}

export function getBugReportNotes(bugReportId: string): BugReportNote[] {
  ensureSeeded();
  const notes = readJson<BugReportNote[]>(BUG_REPORT_NOTES_KEY, []);
  return notes
    .filter((note) => note.bugReportId === bugReportId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

type AddNoteInput = Omit<BugReportNote, "id" | "createdAt">;

export function addBugReportNote(input: AddNoteInput): BugReportNote {
  ensureSeeded();
  const notes = readJson<BugReportNote[]>(BUG_REPORT_NOTES_KEY, []);
  const note: BugReportNote = {
    ...input,
    id: createId("note"),
    createdAt: nowIso(),
  };
  writeJson(BUG_REPORT_NOTES_KEY, [...notes, note]);

  const reports = readJson<BugReport[]>(BUG_REPORTS_KEY, []);
  const index = reports.findIndex((report) => report.id === input.bugReportId);
  if (index !== -1) {
    reports[index] = { ...reports[index], updatedAt: nowIso() };
    writeJson(BUG_REPORTS_KEY, reports);
  }

  return note;
}

export function captureDeviceInfo(): {
  browser: string;
  device: string;
  screenSize: string;
} {
  if (!isBrowser()) {
    return { browser: "Unknown", device: "Unknown", screenSize: "Unknown" };
  }
  const ua = navigator.userAgent;
  let browser = "Unknown browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    browser = "Chrome";
  } else if (ua.includes("Firefox")) {
    browser = "Firefox";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browser = "Safari";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
  }

  const device =
    /Mobi|Android/i.test(ua) ? "Mobile" : /Tablet|iPad/i.test(ua) ? "Tablet" : "Desktop";

  const screenSize = `${window.screen.width}×${window.screen.height}`;

  return { browser, device, screenSize };
}
