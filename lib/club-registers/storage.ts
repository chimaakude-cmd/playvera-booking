import type {
  AttendanceStatus,
  PhotoConsentStatus,
  RegisterAttendanceRecord,
  RegisterChildEntry,
  RegisterGridChild,
  RegisterGridData,
  RegisterSessionDate,
  RegisterSessionOption,
} from "./types";
import type { Booking, BookingStatus } from "@/lib/bookings";
import type { BookingQuestionAnswer } from "@/lib/booking-questions";
import type { CustomerPaymentStatus } from "@/lib/club-customers";
import { shouldShowClubDemoData } from "@/lib/club-demo-mode";
import { getBookings } from "@/lib/bookings";
import {
  getSessionById,
  getSessions,
  getActiveSessionDates,
  type ClubSession,
} from "@/lib/sessions";
import {
  buildDemoBlockSessionDates,
  buildDemoRegisterGridChildren,
  getDemoBlockSessionOptions,
  isDemoBlockSession,
  isDemoRegisterSessionId,
} from "./seed";
import {
  filterRegisterBookings,
  isIncludedOnRegister,
  mapBookingPaymentStatus,
  mapBookingToRegisterDateStatus,
} from "./filters";

export const REGISTER_ATTENDANCE_KEY = "activora-register-attendance";

export function buildRegisterSessionId(
  sessionId: string,
  date: string,
  startTime: string,
): string {
  return `${sessionId}__${date}__${startTime}`;
}

export function formatShortDateLabel(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}`;
}

export function formatFullDateLabel(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function parsePhotoConsent(
  value: string | boolean | undefined,
): PhotoConsentStatus {
  if (value === true || value === "yes" || value === "Yes") {
    return "allowed";
  }
  if (value === false || value === "no" || value === "No") {
    return "not_allowed";
  }
  return "unknown";
}

function formatBookingReference(bookingId: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const suffix = bookingId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `PV-${year}-${suffix}`;
}

function extractParentPhone(
  booking: Booking,
  answers: BookingQuestionAnswer[],
): string {
  const fromAnswers = answers.find(
    (a) => a.key === "emergency_contact_number",
  )?.value;
  if (typeof fromAnswers === "string" && fromAnswers.trim()) {
    return fromAnswers.trim();
  }
  return booking.emergencyContact.trim();
}

function resolveTicketType(session: ClubSession | undefined): string | undefined {
  const ticket =
    session?.tickets?.find((t) => t.id === session.ticketSummaryPrimaryId) ??
    session?.tickets?.[0];
  return ticket?.name;
}

function buildSessionDatesForRegister(
  session: ClubSession | undefined,
  primaryOption: RegisterSessionOption,
): RegisterSessionDate[] {
  const isBlock =
    session?.bookingStructure === "block" ||
    (session?.schedule?.dates?.length ?? 0) > 1 ||
    primaryOption.isBlock;

  if (!isBlock) {
    return [
      {
        date: primaryOption.date,
        dateLabel: formatFullDateLabel(primaryOption.date),
        shortDateLabel: formatShortDateLabel(primaryOption.date),
        registerSessionId: primaryOption.id,
        startTime: primaryOption.startTime,
        endTime: primaryOption.endTime,
      },
    ];
  }

  const slots = session ? getActiveSessionDates(session) : [];
  if (slots.length === 0 && isDemoBlockSession(primaryOption.sessionId)) {
    return buildDemoBlockSessionDates(
      buildRegisterSessionId,
      formatShortDateLabel,
      formatFullDateLabel,
    );
  }

  return slots.map((slot) => ({
    date: slot.date,
    dateLabel: formatFullDateLabel(slot.date),
    shortDateLabel: formatShortDateLabel(slot.date),
    registerSessionId: buildRegisterSessionId(
      primaryOption.sessionId,
      slot.date,
      slot.startTime,
    ),
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

function mapBookingToRegisterEntry(
  booking: Booking,
  attendance: AttendanceStatus,
  notes: string,
  sessionTitle: string,
): RegisterChildEntry {
  const answers: BookingQuestionAnswer[] = booking.bookingAnswers ?? [];
  const medicalConditions =
    booking.medicalConditions ??
    String(answers.find((a) => a.key === "medical_conditions")?.value ?? "");
  const allergies =
    booking.allergies ??
    String(answers.find((a) => a.key === "allergies")?.value ?? "");
  const medicationNotes =
    booking.medicationNotes ??
    String(answers.find((a) => a.key === "medication")?.value ?? "");

  const photoAnswer = answers.find((a) => a.key === "photo_consent_session");
  const photoConsent = parsePhotoConsent(
    booking.photoConsentSession ?? photoAnswer?.value,
  );

  const emergencyName =
    String(
      answers.find((a) => a.key === "emergency_contact_name")?.value ?? "",
    ) || booking.parentName;
  const emergencyPhone =
    String(
      answers.find((a) => a.key === "emergency_contact_number")?.value ?? "",
    ) || booking.emergencyContact;

  const registerAnswers = answers.filter((a) => a.showOnRegister);

  return {
    bookingId: booking.id,
    bookingReference: formatBookingReference(booking.id, booking.createdAt),
    childName: booking.childName,
    childAge: booking.childAge,
    parentName: booking.parentName,
    parentEmail: booking.email,
    parentPhone: extractParentPhone(booking, answers),
    emergencyContact: booking.emergencyContact,
    emergencyContactName: emergencyName,
    emergencyContactPhone: emergencyPhone,
    hasMedicalFlag: Boolean(
      medicalConditions.trim() || allergies.trim() || medicationNotes.trim(),
    ),
    medicalConditions,
    allergies,
    medicationNotes,
    photoConsent,
    hasBookingQuestions: registerAnswers.length > 0,
    bookingQuestionAnswers: registerAnswers,
    paymentStatus: mapBookingPaymentStatus(booking),
    pricePaid: booking.pricePaid,
    sessionTitle,
    attendance,
    notes,
  };
}

function buildGridChildFromBooking(
  booking: Booking,
  sessionDates: RegisterSessionDate[],
  session: ClubSession | undefined,
  registerSession: RegisterSessionOption,
): RegisterGridChild | null {
  const bookingStatus = mapBookingToRegisterDateStatus(booking);
  const activeByDate: Record<string, boolean> = {};
  const statusByDate: RegisterGridChild["statusByDate"] = {};
  const attendanceByDate: Record<string, AttendanceStatus> = {};
  const visibleSessionDates: RegisterSessionDate[] = [];

  for (const sessionDate of sessionDates) {
    statusByDate[sessionDate.registerSessionId] = bookingStatus;
    const active = isIncludedOnRegister(bookingStatus);
    activeByDate[sessionDate.registerSessionId] = active;

    if (active) {
      visibleSessionDates.push({
        ...sessionDate,
        bookingStatus: bookingStatus.bookingStatus,
        paymentStatus: bookingStatus.paymentStatus,
      });
    }

    const saved = getRegisterAttendance(sessionDate.registerSessionId).entries[
      booking.id
    ];
    attendanceByDate[sessionDate.registerSessionId] =
      saved?.attendance ?? "not_marked";
  }

  if (!Object.values(activeByDate).some(Boolean)) {
    return null;
  }

  const primaryDateId =
    registerSession.id in attendanceByDate
      ? registerSession.id
      : (visibleSessionDates[0]?.registerSessionId ?? sessionDates[0].registerSessionId);

  const entry = mapBookingToRegisterEntry(
    booking,
    attendanceByDate[primaryDateId] ?? "not_marked",
    getRegisterAttendance(primaryDateId).entries[booking.id]?.notes ?? "",
    registerSession.activityTitle,
  );

  return {
    ...entry,
    ticketType: resolveTicketType(session),
    sessionDates: visibleSessionDates,
    attendanceByDate,
    activeByDate,
    statusByDate,
  };
}

export function getRegisterSessionOptions(): RegisterSessionOption[] {
  const sessions = getSessions().filter((s) => s.published !== false);
  const options: RegisterSessionOption[] = [];

  for (const session of sessions) {
    const dates = session.schedule?.dates ?? [];
    const isBlock =
      session.bookingStructure === "block" || dates.length > 1;

    if (dates.length > 0) {
      for (const slot of dates) {
        if (slot.cancelled) continue;
        options.push({
          id: buildRegisterSessionId(session.id, slot.date, slot.startTime),
          sessionId: session.id,
          activityTitle: session.sessionTitle,
          venue: session.location,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          day: session.day,
          bookingStructure: session.bookingStructure,
          capacity: slot.capacity ?? session.capacity,
          isBlock,
        });
      }
      continue;
    }

    const today = new Date().toISOString().slice(0, 10);
    options.push({
      id: buildRegisterSessionId(session.id, today, session.startTime),
      sessionId: session.id,
      activityTitle: session.sessionTitle,
      venue: session.location,
      date: today,
      startTime: session.startTime,
      endTime: session.endTime,
      day: session.day,
      bookingStructure: session.bookingStructure,
      capacity: session.capacity,
      isBlock: session.bookingStructure === "block",
    });
  }

  if (shouldShowClubDemoData()) {
    options.push(...getDemoBlockSessionOptions());
  }

  return options.sort((a, b) => {
    const left = `${a.date}T${a.startTime}`;
    const right = `${b.date}T${b.startTime}`;
    return left.localeCompare(right);
  });
}

export function buildRegisterGrid(
  registerSession: RegisterSessionOption,
): RegisterGridData {
  const session = getSessionById(registerSession.sessionId);
  const sessionDates = buildSessionDatesForRegister(session, registerSession);
  const isBlockMode = sessionDates.length > 1;

  const blockLabel = isBlockMode
    ? `${formatShortDateLabel(sessionDates[0].date)} – ${formatShortDateLabel(sessionDates[sessionDates.length - 1].date)}`
    : undefined;

  const bookings = filterRegisterBookings(
    getBookings().filter((b) => b.sessionId === registerSession.sessionId),
  );

  let children: RegisterGridChild[];
  let usingDemoData = false;

  if (isDemoBlockSession(registerSession.sessionId)) {
    const attendanceBySessionAndBooking: Record<
      string,
      Record<string, { attendance: AttendanceStatus; notes: string }>
    > = {};

    for (const sessionDate of sessionDates) {
      const record = getRegisterAttendance(sessionDate.registerSessionId);
      attendanceBySessionAndBooking[sessionDate.registerSessionId] =
        Object.fromEntries(
          Object.entries(record.entries).map(([bookingId, value]) => [
            bookingId,
            { attendance: value.attendance, notes: value.notes },
          ]),
        );
    }

    children = buildDemoRegisterGridChildren(
      sessionDates,
      attendanceBySessionAndBooking,
      registerSession,
    );
    usingDemoData = true;
  } else {
    children = bookings
      .map((booking) =>
        buildGridChildFromBooking(
          booking,
          sessionDates,
          session,
          registerSession,
        ),
      )
      .filter((child): child is RegisterGridChild => child !== null);
  }

  const resolvedCapacity =
    registerSession.capacity ?? session?.capacity ?? 16;
  const capacityFilled = children.length;
  const capacityPercent =
    resolvedCapacity > 0
      ? Math.round((capacityFilled / resolvedCapacity) * 100)
      : 0;

  return {
    meta: {
      sessionId: registerSession.sessionId,
      primaryRegisterSessionId: registerSession.id,
      activityTitle: registerSession.activityTitle,
      venue: registerSession.venue,
      isBlockMode,
      blockLabel,
      startTime: registerSession.startTime,
      endTime: registerSession.endTime,
      capacity: resolvedCapacity,
      capacityFilled,
      capacityPercent,
      sessionDates,
      selectedDateId: registerSession.id,
      usingDemoData,
    },
    children,
  };
}

export function getRegisterEntriesForSession(
  registerSession: RegisterSessionOption,
): RegisterChildEntry[] {
  const grid = buildRegisterGrid(registerSession);
  return grid.children.map((child) => ({
    ...child,
    attendance:
      child.attendanceByDate[registerSession.id] ?? child.attendance,
  }));
}

export function getRegisterAttendance(
  registerSessionId: string,
): RegisterAttendanceRecord {
  if (typeof window === "undefined") {
    return { registerSessionId, entries: {}, savedAt: null };
  }

  try {
    const raw = localStorage.getItem(REGISTER_ATTENDANCE_KEY);
    if (!raw) {
      return { registerSessionId, entries: {}, savedAt: null };
    }

    const all = JSON.parse(raw) as Record<string, RegisterAttendanceRecord>;
    return (
      all[registerSessionId] ?? {
        registerSessionId,
        entries: {},
        savedAt: null,
      }
    );
  } catch {
    return { registerSessionId, entries: {}, savedAt: null };
  }
}

export function saveRegisterAttendance(
  registerSessionId: string,
  entries: RegisterChildEntry[],
): RegisterAttendanceRecord {
  const record: RegisterAttendanceRecord = {
    registerSessionId,
    entries: Object.fromEntries(
      entries.map((entry) => [
        entry.bookingId,
        {
          attendance: entry.attendance,
          notes: entry.notes,
          updatedAt: new Date().toISOString(),
        },
      ]),
    ),
    savedAt: new Date().toISOString(),
  };

  persistAttendanceRecord(record);
  return record;
}

export function saveRegisterGridAttendance(
  grid: RegisterGridData,
): RegisterAttendanceRecord[] {
  const records: RegisterAttendanceRecord[] = [];

  for (const sessionDate of grid.meta.sessionDates) {
    const entriesForDate = grid.children
      .filter((child) => child.activeByDate[sessionDate.registerSessionId])
      .map((child) => ({
        bookingId: child.bookingId,
        attendance:
          child.attendanceByDate[sessionDate.registerSessionId] ?? "not_marked",
        notes: child.notes,
      }));

    const record: RegisterAttendanceRecord = {
      registerSessionId: sessionDate.registerSessionId,
      entries: Object.fromEntries(
        entriesForDate.map((entry) => [
          entry.bookingId,
          {
            attendance: entry.attendance,
            notes: entry.notes,
            updatedAt: new Date().toISOString(),
          },
        ]),
      ),
      savedAt: new Date().toISOString(),
    };

    persistAttendanceRecord(record);
    records.push(record);
  }

  return records;
}

export function saveRegisterDateAttendance(
  registerSessionId: string,
  bookingId: string,
  attendance: AttendanceStatus,
  notes = "",
): RegisterAttendanceRecord {
  const existing = getRegisterAttendance(registerSessionId);
  const record: RegisterAttendanceRecord = {
    registerSessionId,
    entries: {
      ...existing.entries,
      [bookingId]: {
        attendance,
        notes,
        updatedAt: new Date().toISOString(),
      },
    },
    savedAt: new Date().toISOString(),
  };

  persistAttendanceRecord(record);
  return record;
}

function persistAttendanceRecord(record: RegisterAttendanceRecord): void {
  if (typeof window === "undefined") return;
  if (isDemoRegisterSessionId(record.registerSessionId)) return;

  try {
    const raw = localStorage.getItem(REGISTER_ATTENDANCE_KEY);
    const all = raw
      ? (JSON.parse(raw) as Record<string, RegisterAttendanceRecord>)
      : {};
    all[record.registerSessionId] = record;
    localStorage.setItem(REGISTER_ATTENDANCE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors in stub
  }
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  not_marked: "Not marked",
};

export const PHOTO_CONSENT_LABELS: Record<PhotoConsentStatus, string> = {
  allowed: "Photo consent allowed",
  not_allowed: "Photo consent not allowed",
  unknown: "Photo consent unknown",
};

export const PAYMENT_STATUS_LABELS: Record<CustomerPaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  partial_refund: "Partial refund",
  failed: "Failed",
  refund_requested: "Refund requested",
};

export function updateRegisterEntryPaymentStatus(
  entry: RegisterChildEntry,
  status: CustomerPaymentStatus,
): RegisterChildEntry {
  return { ...entry, paymentStatus: status };
}

export function updateRegisterEntryBookingStatus(
  entry: RegisterChildEntry,
  status: BookingStatus,
): RegisterChildEntry {
  if (status === "cancelled") {
    return { ...entry, paymentStatus: "refunded" };
  }
  if (status === "refund_requested") {
    return { ...entry, paymentStatus: "refund_requested" };
  }
  return entry;
}

export function countPresentForDate(
  children: RegisterGridChild[],
  registerSessionId: string,
): { present: number; total: number } {
  const active = children.filter(
    (child) => child.activeByDate[registerSessionId],
  );
  const present = active.filter(
    (child) =>
      child.attendanceByDate[registerSessionId] === "present" ||
      child.attendanceByDate[registerSessionId] === "late",
  ).length;
  return { present, total: active.length };
}

export function isBirthdayInSessionWeek(
  dateOfBirth: string | undefined,
  sessionDate: string,
): boolean {
  if (!dateOfBirth) return false;
  const session = new Date(`${sessionDate}T12:00:00`);
  const dob = new Date(`${dateOfBirth}T12:00:00`);
  const weekStart = new Date(session);
  weekStart.setDate(session.getDate() - session.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const birthdayThisYear = new Date(
    session.getFullYear(),
    dob.getMonth(),
    dob.getDate(),
  );
  return birthdayThisYear >= weekStart && birthdayThisYear <= weekEnd;
}
