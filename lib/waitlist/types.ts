import type { BookingQuestionAnswer } from "@/lib/booking-questions";

/**
 * Session waitlist entries.
 *
 * Storage (today): localStorage key `activora-waitlist-entries`
 * Database (migration): public.waitlist_entries
 */

export type WaitlistEntryStatus =
  | "WAITLIST_PENDING"
  | "INVITED_TO_BOOK"
  | "PAYMENT_PENDING"
  | "BOOKED"
  | "DECLINED"
  | "EXPIRED";

export type WaitlistEntry = {
  id: string;
  sessionId: string;
  parentId: string | null;
  childId: string | null;
  guestBookingId: string | null;
  position: number;
  joinedAt: string;
  expiresAt: string | null;
  status: WaitlistEntryStatus;
  inviteToken: string | null;
  inviteExpiresAt: string | null;
  parentName: string;
  email: string;
  childName: string;
  childAge: number;
  emergencyContact: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  authorizedCollectionPerson?: string;
  bookingAnswers?: BookingQuestionAnswer[];
  medicalConditions?: string;
  allergies?: string;
  medicationNotes?: string;
  photoConsentSession?: boolean | null;
  photoConsentMarketing?: boolean | null;
};

export type NewWaitlistEntry = Omit<
  WaitlistEntry,
  "id" | "position" | "joinedAt" | "status" | "inviteToken" | "inviteExpiresAt"
>;

export const WAITLIST_STORAGE_KEY = "activora-waitlist-entries";

export const WAITLIST_INVITE_DURATION_MS = 15 * 60 * 1000;

export const WAITLIST_STATUS_LABELS: Record<WaitlistEntryStatus, string> = {
  WAITLIST_PENDING: "On waitlist",
  INVITED_TO_BOOK: "Invited — complete payment",
  PAYMENT_PENDING: "Payment in progress",
  BOOKED: "Booked",
  DECLINED: "Declined",
  EXPIRED: "Invitation expired",
};

export const ACTIVE_WAITLIST_STATUSES: WaitlistEntryStatus[] = [
  "WAITLIST_PENDING",
  "INVITED_TO_BOOK",
  "PAYMENT_PENDING",
];
