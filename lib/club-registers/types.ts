import type { BookingQuestionAnswer } from "@/lib/booking-questions";
import type { BookingStatus } from "@/lib/bookings";
import type { CustomerPaymentStatus } from "@/lib/club-customers";
import type { BookingStructureType } from "@/lib/sessions";

export type AttendanceStatus = "present" | "late" | "absent" | "not_marked";

export type PhotoConsentStatus = "allowed" | "not_allowed" | "unknown";

export type RegisterSessionOption = {
  id: string;
  sessionId: string;
  activityTitle: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  day: string;
  bookingStructure?: BookingStructureType;
  capacity?: number;
  isBlock?: boolean;
};

export type RegisterSessionDate = {
  date: string;
  dateLabel: string;
  shortDateLabel: string;
  registerSessionId: string;
  startTime: string;
  endTime: string;
  bookingStatus?: BookingStatus;
  paymentStatus?: CustomerPaymentStatus;
};

export type RegisterChildEntry = {
  bookingId: string;
  bookingReference: string;
  childName: string;
  childAge: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContact: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hasMedicalFlag: boolean;
  medicalConditions: string;
  allergies: string;
  medicationNotes: string;
  photoConsent: PhotoConsentStatus;
  hasBookingQuestions: boolean;
  bookingQuestionAnswers: BookingQuestionAnswer[];
  paymentStatus: CustomerPaymentStatus;
  pricePaid: number;
  sessionTitle: string;
  isDemo?: boolean;
  attendance: AttendanceStatus;
  notes: string;
};

export type RegisterGridChild = RegisterChildEntry & {
  ticketType?: string;
  dateOfBirth?: string;
  sessionDates: RegisterSessionDate[];
  attendanceByDate: Record<string, AttendanceStatus>;
  /** Per registerSessionId — false when that date is cancelled/refunded for this child */
  activeByDate: Record<string, boolean>;
  statusByDate: Record<string, { bookingStatus: BookingStatus; paymentStatus: CustomerPaymentStatus }>;
};

export type RegisterGridMeta = {
  sessionId: string;
  primaryRegisterSessionId: string;
  activityTitle: string;
  venue: string;
  isBlockMode: boolean;
  blockLabel?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  capacityFilled: number;
  capacityPercent: number;
  sessionDates: RegisterSessionDate[];
  selectedDateId: string;
  usingDemoData: boolean;
};

export type RegisterGridData = {
  meta: RegisterGridMeta;
  children: RegisterGridChild[];
};

export type RegisterAttendanceRecord = {
  registerSessionId: string;
  entries: Record<
    string,
    { attendance: AttendanceStatus; notes: string; updatedAt: string }
  >;
  savedAt: string | null;
};
