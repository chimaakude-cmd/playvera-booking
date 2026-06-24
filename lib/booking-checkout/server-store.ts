import type { BookingQuestionAnswer } from "@/lib/booking-questions";

export type PendingBookingPayload = {
  sessionId: string;
  sessionTitle: string;
  providerName: string;
  day: string;
  startTime: string;
  endTime: string;
  pricePaid: number;
  /** Server-resolved platform fee percent at checkout creation. */
  platformFeePercent?: number;
  platformFee?: number;
  applicationFeePence?: number;
  platformFeeSource?: string;
  estimatedStripeFee?: number;
  estimatedProviderPayout?: number;
  feeHandling?: string;
  parentName: string;
  email: string;
  childName: string;
  childAge: number;
  childId?: string;
  emergencyContact: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  authorizedCollectionPerson: string;
  bookingAnswers: BookingQuestionAnswer[];
  medicalConditions: string;
  allergies: string;
  medicationNotes: string;
  photoConsentSession: boolean | null;
  photoConsentMarketing: boolean | null;
  accessMode: "guest" | "parent";
};

export type PendingBookingStatus = "pending_payment" | "confirmed" | "expired";

export type PendingBookingRecord = {
  id: string;
  sessionId: string;
  stripeCheckoutSessionId: string | null;
  status: PendingBookingStatus;
  payload: PendingBookingPayload;
  createdAt: string;
  confirmedAt: string | null;
};

const pendingBookings = new Map<string, PendingBookingRecord>();
const checkoutIndex = new Map<string, string>();

export function createPendingBooking(
  payload: PendingBookingPayload,
): PendingBookingRecord {
  const record: PendingBookingRecord = {
    id: crypto.randomUUID(),
    sessionId: payload.sessionId,
    stripeCheckoutSessionId: null,
    status: "pending_payment",
    payload,
    createdAt: new Date().toISOString(),
    confirmedAt: null,
  };
  pendingBookings.set(record.id, record);
  return record;
}

export function getPendingBooking(id: string): PendingBookingRecord | null {
  return pendingBookings.get(id) ?? null;
}

export function linkStripeCheckoutSession(
  pendingId: string,
  checkoutSessionId: string,
): PendingBookingRecord | null {
  const record = pendingBookings.get(pendingId);
  if (!record) {
    return null;
  }
  const next: PendingBookingRecord = {
    ...record,
    stripeCheckoutSessionId: checkoutSessionId,
  };
  pendingBookings.set(pendingId, next);
  checkoutIndex.set(checkoutSessionId, pendingId);
  return next;
}

export function findPendingByCheckoutSession(
  checkoutSessionId: string,
): PendingBookingRecord | null {
  const pendingId = checkoutIndex.get(checkoutSessionId);
  if (!pendingId) {
    return null;
  }
  return pendingBookings.get(pendingId) ?? null;
}

export function confirmPendingBooking(
  id: string,
): PendingBookingRecord | null {
  const record = pendingBookings.get(id);
  if (!record) {
    return null;
  }
  const next: PendingBookingRecord = {
    ...record,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  };
  pendingBookings.set(id, next);
  return next;
}
