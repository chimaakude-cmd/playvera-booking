import type { Booking, BookingStatus } from "@/lib/bookings";
import { getBookings, updateBookingStatus } from "@/lib/bookings";
import { parsePhotoConsent } from "@/lib/club-registers/storage";
import type { RegisterAttendanceRecord } from "@/lib/club-registers/types";
import {
  filterProductionClubRecords,
  shouldShowClubDemoData,
} from "@/lib/club-demo-mode";
import type {
  ClubCustomer,
  CustomerAttendanceRecord,
  CustomerBookingSummary,
  CustomerChild,
  CustomerMetrics,
  CustomerPaymentStatus,
  CustomerRefundRecord,
} from "./types";
import { buildDemoCustomerBookings } from "./demo-seed";

const REGISTER_ATTENDANCE_KEY = "activora-register-attendance";

export const CUSTOMER_NOTES_KEY = "activora-customer-notes";
export const CUSTOMER_REFUNDS_KEY = "activora-customer-refunds";

function customerIdFromEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapPaymentStatus(booking: Booking): CustomerPaymentStatus {
  if (booking.status === "refund_requested") return "refund_requested";
  if (booking.status === "cancelled") return "refunded";
  if (booking.status === "pending") return "pending";
  return "paid";
}

function formatBookingDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function loadCustomerNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOMER_NOTES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveCustomerNotes(customerId: string, notes: string): void {
  if (typeof window === "undefined") return;
  const all = loadCustomerNotes();
  all[customerId] = notes;
  localStorage.setItem(CUSTOMER_NOTES_KEY, JSON.stringify(all));
}

function loadCustomerRefunds(): CustomerRefundRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOMER_REFUNDS_KEY);
    return raw ? (JSON.parse(raw) as CustomerRefundRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomerRefund(refund: CustomerRefundRecord): void {
  if (typeof window === "undefined") return;
  const all = loadCustomerRefunds();
  all.unshift(refund);
  localStorage.setItem(CUSTOMER_REFUNDS_KEY, JSON.stringify(all));
}

function loadAllAttendance(): Record<string, RegisterAttendanceRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REGISTER_ATTENDANCE_KEY);
    return raw
      ? (JSON.parse(raw) as Record<string, RegisterAttendanceRecord>)
      : {};
  } catch {
    return {};
  }
}

function buildChildFromBooking(booking: Booking): CustomerChild {
  return {
    id: `${booking.id}-child`,
    name: booking.childName,
    age: booking.childAge,
    medicalConditions: booking.medicalConditions ?? "",
    allergies: booking.allergies ?? "",
    medicationNotes: booking.medicationNotes ?? "",
    photoConsent: parsePhotoConsent(booking.photoConsentSession ?? undefined),
  };
}

function mergeChildren(
  existing: CustomerChild[],
  booking: Booking,
): CustomerChild[] {
  const match = existing.find((c) => c.name === booking.childName);
  if (match) {
    return existing.map((child) =>
      child.name === booking.childName
        ? {
            ...child,
            age: booking.childAge,
            medicalConditions:
              booking.medicalConditions || child.medicalConditions,
            allergies: booking.allergies || child.allergies,
            medicationNotes:
              booking.medicationNotes || child.medicationNotes,
            photoConsent: parsePhotoConsent(booking.photoConsentSession ?? undefined),
          }
        : child,
    );
  }
  return [...existing, buildChildFromBooking(booking)];
}

function bookingToSummary(booking: Booking): CustomerBookingSummary {
  return {
    id: booking.id,
    sessionTitle: booking.sessionTitle,
    venue: booking.providerName,
    dateLabel: formatBookingDate(booking.createdAt),
    status: booking.status,
    paymentStatus: mapPaymentStatus(booking),
    amount: booking.pricePaid,
    createdAt: booking.createdAt,
  };
}

function deriveAggregatePaymentStatus(
  bookings: CustomerBookingSummary[],
  refunds: CustomerRefundRecord[],
): CustomerPaymentStatus {
  if (refunds.some((r) => r.status === "pending")) return "refund_requested";
  if (bookings.every((b) => b.paymentStatus === "refunded")) return "refunded";
  if (bookings.some((b) => b.paymentStatus === "refund_requested")) {
    return "refund_requested";
  }
  if (refunds.some((r) => r.type === "partial" && r.status === "completed")) {
    return "partial_refund";
  }
  if (bookings.some((b) => b.paymentStatus === "pending")) return "pending";
  return "paid";
}

function deriveBookingStatus(
  bookings: CustomerBookingSummary[],
): BookingStatus | "mixed" {
  const statuses = new Set(bookings.map((b) => b.status));
  if (statuses.size === 1) {
    return [...statuses][0];
  }
  return "mixed";
}

function buildAttendanceForBookings(
  bookings: Booking[],
  attendanceStore: Record<string, RegisterAttendanceRecord>,
): CustomerAttendanceRecord[] {
  const records: CustomerAttendanceRecord[] = [];

  for (const register of Object.values(attendanceStore)) {
    for (const booking of bookings) {
      const entry = register.entries[booking.id];
      if (entry) {
        records.push({
          id: `${register.registerSessionId}-${booking.id}`,
          sessionTitle: booking.sessionTitle,
          dateLabel: formatBookingDate(entry.updatedAt),
          status: entry.attendance,
        });
      }
    }
  }

  return records;
}

function buildCustomerFromBookings(
  email: string,
  parentName: string,
  phone: string,
  bookings: Booking[],
  notesMap: Record<string, string>,
  allRefunds: CustomerRefundRecord[],
): ClubCustomer {
  const id = customerIdFromEmail(email);
  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let children: CustomerChild[] = [];
  for (const booking of sorted) {
    children = mergeChildren(children, booking);
  }

  const summaries = sorted.map(bookingToSummary);
  const refunds = allRefunds.filter((r) =>
    sorted.some((b) => b.id === r.bookingId),
  );
  const totalSpend = summaries
    .filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "pending")
    .reduce((sum, b) => sum + b.amount, 0);

  const latest = sorted[0];
  const photoConsent = children.some((c) => c.photoConsent === "not_allowed")
    ? "not_allowed"
    : children.some((c) => c.photoConsent === "allowed")
      ? "allowed"
      : "unknown";

  const attendance = buildAttendanceForBookings(
    sorted,
    loadAllAttendance(),
  );

  return {
    id,
    parentName,
    email,
    phone,
    emergencyContact: sorted[0]?.emergencyContact ?? phone,
    emergencyContactName:
      sorted[0]?.bookingAnswers?.find((a) => a.key === "emergency_contact_name")
        ?.value?.toString() ?? parentName,
    children,
    childNamesLabel: children.map((c) => c.name).join(", "),
    latestBooking: latest
      ? `${latest.sessionTitle} · ${formatBookingDate(latest.createdAt)}`
      : "—",
    latestBookingAt: latest?.createdAt ?? "",
    totalBookings: summaries.length,
    totalSpend,
    bookingStatus: deriveBookingStatus(summaries),
    paymentStatus: deriveAggregatePaymentStatus(summaries, refunds),
    hasMedicalNotes: children.some(
      (c) => c.medicalConditions || c.allergies || c.medicationNotes,
    ),
    photoConsent,
    notes: notesMap[id] ?? "",
    bookings: summaries,
    attendance,
    payments: summaries.filter((b) => b.paymentStatus !== "refunded"),
    refunds,
  };
}

export function getClubCustomers(): ClubCustomer[] {
  const bookings = getBookings();
  const notesMap = loadCustomerNotes();
  const allRefunds = loadCustomerRefunds();

  const byEmail = new Map<
    string,
    { parentName: string; phone: string; bookings: Booking[] }
  >();

  for (const booking of bookings) {
    const email = booking.email.trim().toLowerCase();
    const existing = byEmail.get(email);
    if (existing) {
      existing.bookings.push(booking);
    } else {
      byEmail.set(email, {
        parentName: booking.parentName,
        phone: booking.emergencyContact,
        bookings: [booking],
      });
    }
  }

  if (byEmail.size === 0 && shouldShowClubDemoData()) {
    for (const [email, data] of buildDemoCustomerBookings()) {
      byEmail.set(email, data);
    }
  }

  return filterProductionClubRecords(
    Array.from(byEmail.entries())
    .map(([email, data]) =>
      buildCustomerFromBookings(
        email,
        data.parentName,
        data.phone,
        data.bookings,
        notesMap,
        allRefunds,
      ),
    )
    .sort((a, b) => b.latestBookingAt.localeCompare(a.latestBookingAt)),
  );
}

export function getCustomerMetrics(customers: ClubCustomer[]): CustomerMetrics {
  const totalChildren = customers.reduce((sum, c) => sum + c.children.length, 0);
  const repeatCustomers = customers.filter((c) => c.totalBookings > 1).length;
  const activeCustomers = customers.filter(
    (c) => c.bookingStatus === "confirmed" || c.bookingStatus === "pending",
  ).length;
  const totalSpend = customers.reduce((sum, c) => sum + c.totalSpend, 0);
  const outstandingIssues = customers.filter(
    (c) =>
      c.paymentStatus === "refund_requested" ||
      c.paymentStatus === "partial_refund" ||
      c.bookingStatus === "cancelled",
  ).length;

  return {
    totalCustomers: customers.length,
    activeCustomers,
    totalChildren,
    repeatCustomers,
    averageSpend:
      customers.length > 0
        ? Math.round((totalSpend / customers.length) * 100) / 100
        : 0,
    outstandingIssues,
  };
}

export function getCustomerFilterOptions(customers: ClubCustomer[]) {
  return {
    activities: Array.from(
      new Set(customers.flatMap((c) => c.bookings.map((b) => b.sessionTitle))),
    ).sort(),
    venues: Array.from(
      new Set(customers.flatMap((c) => c.bookings.map((b) => b.venue))),
    ).sort(),
  };
}

export function filterCustomers(
  customers: ClubCustomer[],
  filters: import("./types").CustomerFilters,
): ClubCustomer[] {
  const q = filters.query.trim().toLowerCase();

  return customers.filter((customer) => {
    if (q) {
      const haystack = [
        customer.parentName,
        customer.email,
        customer.phone,
        customer.childNamesLabel,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.activity !== "all") {
      const hasActivity = customer.bookings.some(
        (b) => b.sessionTitle === filters.activity,
      );
      if (!hasActivity) return false;
    }

    if (filters.venue !== "all") {
      const hasVenue = customer.bookings.some((b) => b.venue === filters.venue);
      if (!hasVenue) return false;
    }

    if (
      filters.bookingStatus !== "all" &&
      customer.bookingStatus !== filters.bookingStatus
    ) {
      return false;
    }

    if (
      filters.paymentStatus !== "all" &&
      customer.paymentStatus !== filters.paymentStatus
    ) {
      return false;
    }

    return true;
  });
}

export function processCustomerRefund(input: {
  bookingId: string;
  sessionTitle: string;
  amount: number;
  type: "full" | "partial";
  reason: string;
}): CustomerRefundRecord {
  const refund: CustomerRefundRecord = {
    id: `ref-${crypto.randomUUID()}`,
    bookingId: input.bookingId,
    sessionTitle: input.sessionTitle,
    amount: input.amount,
    type: input.type,
    reason: input.reason,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  saveCustomerRefund(refund);
  updateBookingStatus(
    input.bookingId,
    input.type === "full" ? "cancelled" : "refund_requested",
  );
  return refund;
}

export function cancelCustomerBooking(bookingId: string): void {
  updateBookingStatus(bookingId, "cancelled");
}
