/**
 * Callback request types — localStorage today, Supabase later.
 */

export type CallbackReason =
  | "sales"
  | "support"
  | "provider_onboarding"
  | "partnerships"
  | "careers"
  | "technical_issue"
  | "other";

export type CallbackRequestStatus =
  | "new"
  | "scheduled"
  | "completed"
  | "closed";

export type CallbackRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  organisation: string;
  reason: CallbackReason;
  preferredDate: string;
  preferredTime: string;
  additionalNotes: string;
  consentGiven: boolean;
  status: CallbackRequestStatus;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  emailSent: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CallbackRequestNote = {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type CreateCallbackRequestInput = {
  fullName: string;
  email: string;
  phone: string;
  organisation: string;
  reason: CallbackReason;
  preferredDate: string;
  preferredTime: string;
  additionalNotes: string;
  consentGiven: boolean;
};

export const CALLBACK_REASON_LABELS: Record<CallbackReason, string> = {
  sales: "Sales",
  support: "Support",
  provider_onboarding: "Provider onboarding",
  partnerships: "Partnerships",
  careers: "Careers",
  technical_issue: "Technical issue",
  other: "Other",
};

export const CALLBACK_STATUS_LABELS: Record<CallbackRequestStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  completed: "Completed",
  closed: "Closed",
};

export const CALLBACK_REASON_OPTIONS: CallbackReason[] = [
  "sales",
  "support",
  "provider_onboarding",
  "partnerships",
  "careers",
  "technical_issue",
  "other",
];

export const FOOTER_SUPPORT_HOURS =
  "Mon–Fri 07:00–18:00, Sat–Sun 09:00–12:00";
