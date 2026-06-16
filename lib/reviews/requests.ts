import { getBookingById } from "@/lib/bookings";
import { REGISTER_ATTENDANCE_KEY } from "@/lib/club-registers";
import type { RegisterAttendanceRecord } from "@/lib/club-registers";
import { getSessionById } from "@/lib/sessions";
import {
  getClubReviewSettings,
  getReviewLinkForBooking,
  getProviderNameForBooking,
  getSessionTitleForBooking,
} from "./settings";
import type { ReviewRequest } from "./types";

export const REVIEW_REQUESTS_KEY = "activora-review-requests";

const REVIEW_REQUEST_TEMPLATE = {
  subject: "How did your experience go?",
  body: (parentName: string, sessionTitle: string, providerName: string, link: string) =>
    `Hi ${parentName}, we hope your child enjoyed ${sessionTitle} with ${providerName}. How did your experience go? Tap a star to leave a quick verified review: ${link}`,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(): string {
  return `req_${crypto.randomUUID().slice(0, 8)}`;
}

export function getReviewRequests(): ReviewRequest[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(REVIEW_REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as ReviewRequest[]) : [];
  } catch {
    return [];
  }
}

function saveReviewRequests(requests: ReviewRequest[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(REVIEW_REQUESTS_KEY, JSON.stringify(requests));
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getAttendanceMarkedAt(bookingId: string): string | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(REGISTER_ATTENDANCE_KEY);
    if (!raw) return null;

    const all = JSON.parse(raw) as Record<string, RegisterAttendanceRecord>;
    let latest: string | null = null;

    for (const record of Object.values(all)) {
      const entry = record.entries[bookingId];
      if (
        entry &&
        (entry.attendance === "present" || entry.attendance === "late") &&
        entry.updatedAt
      ) {
        if (!latest || entry.updatedAt > latest) {
          latest = entry.updatedAt;
        }
      }
    }
    return latest;
  } catch {
    return null;
  }
}

function isBlockSession(sessionId: string): boolean {
  const session = getSessionById(sessionId);
  return (
    session?.schedule?.bookingType === "block" ||
    session?.bookingStructure === "block" ||
    Boolean(session?.schedule?.blockStartDate)
  );
}

function computeScheduledFor(
  attendanceMarkedAt: string,
  delay: ReturnType<typeof getClubReviewSettings>["requestDelay"],
  sessionId: string,
): string {
  const base = new Date(attendanceMarkedAt);

  if (delay === "same_day") {
    return addHours(base, 6).toISOString();
  }

  if (delay === "end_of_block" && isBlockSession(sessionId)) {
    const session = getSessionById(sessionId);
    const blockEnd = session?.schedule?.blockEndDate;
    if (blockEnd) {
      return addHours(new Date(`${blockEnd}T18:00:00`), 6).toISOString();
    }
  }

  const nextDay = addDays(base, 1);
  nextDay.setHours(10, 0, 0, 0);
  return nextDay.toISOString();
}

export function scheduleReviewRequest(bookingId: string): ReviewRequest | null {
  const settings = getClubReviewSettings();
  if (!settings.autoRequestEnabled) return null;

  const existing = getReviewRequests().find(
    (r) => r.bookingId === bookingId && r.status !== "cancelled",
  );
  if (existing) return existing;

  const booking = getBookingById(bookingId);
  if (!booking) return null;

  const attendanceMarkedAt = getAttendanceMarkedAt(bookingId);
  if (!attendanceMarkedAt) return null;

  const scheduledFor = computeScheduledFor(
    attendanceMarkedAt,
    settings.requestDelay,
    booking.sessionId,
  );

  const reviewLink = getReviewLinkForBooking(bookingId);
  const request: ReviewRequest = {
    id: createId(),
    bookingId,
    childId: booking.childId ?? booking.id,
    parentEmail: booking.email,
    parentName: booking.parentName,
    sessionTitle: getSessionTitleForBooking(bookingId),
    providerName: getProviderNameForBooking(bookingId),
    scheduledFor,
    status: "scheduled",
    reviewLink,
    reminderScheduledFor: settings.reminderDays
      ? addDays(new Date(scheduledFor), settings.reminderDays).toISOString()
      : undefined,
  };

  const requests = getReviewRequests();
  requests.push(request);
  saveReviewRequests(requests);
  return request;
}

export function markReviewRequestSent(requestId: string): ReviewRequest | null {
  const requests = getReviewRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  requests[index] = {
    ...requests[index],
    status: "sent",
    sentAt: new Date().toISOString(),
  };
  saveReviewRequests(requests);
  return requests[index];
}

export function getPendingReviewRequests(): ReviewRequest[] {
  const now = Date.now();
  return getReviewRequests().filter(
    (r) => r.status === "scheduled" && new Date(r.scheduledFor).getTime() <= now,
  );
}

export function getReviewRequestEmailPreview(request: ReviewRequest): {
  subject: string;
  body: string;
} {
  return {
    subject: REVIEW_REQUEST_TEMPLATE.subject,
    body: REVIEW_REQUEST_TEMPLATE.body(
      request.parentName,
      request.sessionTitle,
      request.providerName,
      request.reviewLink,
    ),
  };
}

export function processDueReviewRequests(): ReviewRequest[] {
  const due = getPendingReviewRequests();
  return due.map((request) => markReviewRequestSent(request.id)!).filter(Boolean);
}
