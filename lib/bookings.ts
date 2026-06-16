/**
 * Booking persistence (localStorage).
 *
 * Storage key: playvera-bookings
 *
 * Supabase migration:
 * - Table: public.bookings
 * - Access via: dataLayer.bookings
 */
import { getSessionById } from "./sessions";
import type { BookingQuestionAnswer } from "./booking-questions";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "refund_requested"
  | "waitlist_pending_payment";

export type Booking = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  providerName: string;
  day: string;
  startTime: string;
  endTime: string;
  pricePaid: number;
  parentName: string;
  email: string;
  childName: string;
  childAge: number;
  childId?: string;
  emergencyContact: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  authorizedCollectionPerson?: string;
  accessMode?: "guest" | "parent";
  stripeCheckoutSessionId?: string;
  status: BookingStatus;
  createdAt: string;
  bookingAnswers?: BookingQuestionAnswer[];
  medicalConditions?: string;
  allergies?: string;
  medicationNotes?: string;
  photoConsentSession?: boolean | null;
  photoConsentMarketing?: boolean | null;
};

export const BOOKINGS_STORAGE_KEY = "playvera-bookings";

function normalizeBooking(booking: Booking): Booking {
  const session = getSessionById(booking.sessionId);

  return {
    ...booking,
    status: booking.status ?? "pending",
    providerName:
      booking.providerName ?? session?.location ?? "Activora Club",
    day: booking.day ?? session?.day ?? "",
    startTime: booking.startTime ?? session?.startTime ?? "",
    endTime: booking.endTime ?? session?.endTime ?? "",
    pricePaid: booking.pricePaid ?? session?.price ?? 0,
  };
}

export function getBookings(): Booking[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return (JSON.parse(raw) as Booking[]).map(normalizeBooking);
  } catch {
    return [];
  }
}

export function getBookingById(bookingId: string): Booking | undefined {
  return getBookings().find((booking) => booking.id === bookingId);
}

export type NewBooking = Omit<Booking, "id" | "createdAt" | "status"> & {
  status?: BookingStatus;
};

export function saveBooking(booking: NewBooking): Booking {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    status: booking.status ?? "pending",
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  bookings.push(newBooking);
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));

  return newBooking;
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): void {
  const bookings = getBookings();
  const index = bookings.findIndex((booking) => booking.id === bookingId);

  if (index === -1) {
    return;
  }

  const previousStatus = bookings[index].status;
  bookings[index].status = status;
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));

  if (
    status === "cancelled" &&
    previousStatus !== "cancelled" &&
    typeof window !== "undefined"
  ) {
    const session = getSessionById(bookings[index].sessionId);
    if (session) {
      void fetch("/api/waitlist/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, reason: "cancellation" }),
      });
    }
  }
}

export function requestRefund(bookingId: string): void {
  updateBookingStatus(bookingId, "refund_requested");
}

export function getRecentBookings(limit = 5): Booking[] {
  return [...getBookings()]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}

export function getBookingsBySession(sessionId: string): Booking[] {
  return getBookings().filter((booking) => booking.sessionId === sessionId);
}

export function getUpcomingBookings(): Booking[] {
  return getBookings()
    .filter(
      (booking) =>
        booking.status === "pending" ||
        booking.status === "confirmed" ||
        booking.status === "refund_requested" ||
        booking.status === "waitlist_pending_payment",
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getTotalSpent(bookings: Booking[] = getBookings()): number {
  return bookings
    .filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "pending",
    )
    .reduce((total, booking) => total + booking.pricePaid, 0);
}

export const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  refund_requested: "Refund Requested",
  waitlist_pending_payment: "Waitlist — payment due",
};
