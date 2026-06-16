import type { BookingStatus } from "@/lib/bookings";
import type { PhotoConsentStatus } from "@/lib/club-registers";

export type CustomerPaymentStatus =
  | "paid"
  | "pending"
  | "refunded"
  | "partial_refund"
  | "failed"
  | "refund_requested";

export type CustomerChild = {
  id: string;
  name: string;
  age: number;
  medicalConditions: string;
  allergies: string;
  medicationNotes: string;
  photoConsent: PhotoConsentStatus;
};

export type CustomerBookingSummary = {
  id: string;
  sessionTitle: string;
  venue: string;
  dateLabel: string;
  status: BookingStatus;
  paymentStatus: CustomerPaymentStatus;
  amount: number;
  createdAt: string;
};

export type CustomerAttendanceRecord = {
  id: string;
  sessionTitle: string;
  dateLabel: string;
  status: "present" | "late" | "absent" | "not_marked";
};

export type CustomerRefundRecord = {
  id: string;
  bookingId: string;
  sessionTitle: string;
  amount: number;
  type: "full" | "partial";
  reason: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

export type CustomerMetrics = {
  totalCustomers: number;
  activeCustomers: number;
  totalChildren: number;
  repeatCustomers: number;
  averageSpend: number;
  outstandingIssues: number;
};

export type ClubCustomer = {
  id: string;
  parentName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyContactName: string;
  children: CustomerChild[];
  childNamesLabel: string;
  latestBooking: string;
  latestBookingAt: string;
  totalBookings: number;
  totalSpend: number;
  bookingStatus: BookingStatus | "mixed";
  paymentStatus: CustomerPaymentStatus;
  hasMedicalNotes: boolean;
  photoConsent: PhotoConsentStatus;
  notes: string;
  bookings: CustomerBookingSummary[];
  attendance: CustomerAttendanceRecord[];
  payments: CustomerBookingSummary[];
  refunds: CustomerRefundRecord[];
};

export type CustomerFilters = {
  query: string;
  activity: string;
  venue: string;
  bookingStatus: BookingStatus | "all" | "mixed";
  paymentStatus: CustomerPaymentStatus | "all";
};
