/**
 * Bug report types — localStorage today, Supabase `bug_reports` + `bug_report_notes` later.
 */

export type BugReportAccountType =
  | "parent"
  | "club"
  | "franchisor"
  | "visitor"
  | "other";

export type BugReportPriority = "low" | "normal" | "high" | "urgent";

export type BugReportStatus =
  | "new"
  | "investigating"
  | "in_progress"
  | "fixed"
  | "cannot_reproduce"
  | "closed";

export type BugReportDeviceInfo = {
  browser: string;
  device: string;
  screenSize: string;
};

export type BugReport = {
  id: string;
  reporterName: string;
  reporterEmail: string;
  accountType: BugReportAccountType;
  pageUrl: string;
  description: string;
  stepsToReproduce: string;
  /** Data URL or http(s) URL; omitted when screenshot exceeds size limit. */
  screenshotUrl: string | null;
  priority: BugReportPriority;
  consentGiven: boolean;
  deviceInfo: BugReportDeviceInfo;
  status: BugReportStatus;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BugReportNoteType = "internal" | "status_change";

export type BugReportNote = {
  id: string;
  bugReportId: string;
  authorId: string;
  authorName: string;
  body: string;
  noteType: BugReportNoteType;
  statusFrom?: BugReportStatus;
  statusTo?: BugReportStatus;
  createdAt: string;
};

export type CreateBugReportInput = {
  reporterName: string;
  reporterEmail: string;
  accountType: BugReportAccountType;
  pageUrl: string;
  description: string;
  stepsToReproduce: string;
  screenshotUrl: string | null;
  priority: BugReportPriority;
  consentGiven: boolean;
  deviceInfo: BugReportDeviceInfo;
};

export const BUG_REPORT_ACCOUNT_TYPE_LABELS: Record<
  BugReportAccountType,
  string
> = {
  parent: "Parent",
  club: "Club",
  franchisor: "Franchisor",
  visitor: "Visitor",
  other: "Other",
};

export const BUG_REPORT_PRIORITY_LABELS: Record<BugReportPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const BUG_REPORT_STATUS_LABELS: Record<BugReportStatus, string> = {
  new: "New",
  investigating: "Investigating",
  in_progress: "In progress",
  fixed: "Fixed",
  cannot_reproduce: "Cannot reproduce",
  closed: "Closed",
};
