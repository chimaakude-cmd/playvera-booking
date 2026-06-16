import { getBookingById, statusLabels, type BookingStatus } from "@/lib/bookings";
import { REGISTER_ATTENDANCE_KEY } from "@/lib/club-registers";
import type { AttendanceStatus, RegisterAttendanceRecord } from "@/lib/club-registers/types";
import { getSessionById } from "@/lib/sessions";
import type { BookingProof, Review } from "./types";
import { COMPLETED_BOOKING_REQUIRED_MESSAGE } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isCompletedBookingStatus(status: BookingStatus): boolean {
  return status === "confirmed";
}

export function getBookingAttendanceStatus(
  bookingId: string,
): AttendanceStatus | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(REGISTER_ATTENDANCE_KEY);
    if (!raw) return null;

    const all = JSON.parse(raw) as Record<string, RegisterAttendanceRecord>;
    for (const record of Object.values(all)) {
      const entry = record.entries[bookingId];
      if (entry) {
        return entry.attendance;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function formatAttendanceStatus(status: AttendanceStatus | null): string {
  if (!status || status === "not_marked") return "Not marked";
  if (status === "present") return "Present";
  if (status === "late") return "Late";
  if (status === "absent") return "Absent";
  return status;
}

function formatPaymentStatus(bookingStatus: BookingStatus): string {
  return statusLabels[bookingStatus] ?? bookingStatus;
}

export type BookingEligibilityResult = {
  eligible: boolean;
  reason?: string;
  bookingId: string;
  parentId?: string;
  childId?: string;
  sessionId?: string;
  providerId?: string;
  attendanceStatus?: AttendanceStatus | null;
};

export function validateBookingEligibility(
  bookingId: string,
): BookingEligibilityResult {
  const booking = getBookingById(bookingId);
  if (!booking || !isCompletedBookingStatus(booking.status)) {
    return {
      eligible: false,
      reason: COMPLETED_BOOKING_REQUIRED_MESSAGE,
      bookingId,
    };
  }

  const attendanceStatus = getBookingAttendanceStatus(bookingId);
  const attended =
    attendanceStatus === "present" || attendanceStatus === "late";

  if (!attended) {
    return {
      eligible: false,
      reason: COMPLETED_BOOKING_REQUIRED_MESSAGE,
      bookingId,
      parentId: booking.email,
      childId: booking.childId,
      sessionId: booking.sessionId,
      attendanceStatus,
    };
  }

  return {
    eligible: true,
    bookingId,
    parentId: booking.email,
    childId: booking.childId ?? booking.id,
    sessionId: booking.sessionId,
    attendanceStatus,
  };
}

export function getBookingProof(review: Review): BookingProof | null {
  const booking = getBookingById(review.bookingId);
  if (!booking) return null;

  const session = getSessionById(booking.sessionId);
  const attendanceStatus = getBookingAttendanceStatus(review.bookingId);

  return {
    bookingId: review.bookingId,
    sessionName:
      session?.sessionTitle ?? booking.sessionTitle ?? review.sessionTitle,
    provider:
      booking.providerName ?? review.providerName ?? "Unknown provider",
    dateAttended: review.dateAttended,
    paymentStatus: formatPaymentStatus(booking.status),
    attendanceStatus: formatAttendanceStatus(attendanceStatus),
    reviewerEmail: review.reviewerEmail ?? booking.email ?? "—",
  };
}

export function getBookingProofForReviewId(
  reviewId: string,
  getReview: (id: string) => Review | undefined,
): BookingProof | null {
  const review = getReview(reviewId);
  if (!review) return null;
  return getBookingProof(review);
}
