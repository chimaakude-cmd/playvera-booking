import type { BookingQuestionAnswer } from "@/lib/booking-questions";
import type { BookingStatus } from "@/lib/bookings";
import type { CustomerPaymentStatus } from "@/lib/club-customers";
import type {
  AttendanceStatus,
  PhotoConsentStatus,
  RegisterChildEntry,
  RegisterGridChild,
  RegisterSessionDate,
  RegisterSessionOption,
} from "./types";
import { isIncludedOnRegister } from "./filters";

export const DEMO_BLOCK_SESSION_ID = "demo-block-summer-camp";

/** Static image for the example activity card (club dashboard only). */
export const DEMO_BLOCK_IMAGE_SRC = "/branding/activora-hero.png";

export const DEMO_BLOCK_ACTIVITY_TITLE = "Summer Skills Block";

export const DEMO_BLOCK_DATES = [
  { date: "2026-06-18", startTime: "16:00", endTime: "17:30" },
  { date: "2026-06-25", startTime: "16:00", endTime: "17:30" },
  { date: "2026-07-02", startTime: "16:00", endTime: "17:30" },
  { date: "2026-07-09", startTime: "16:00", endTime: "17:30" },
] as const;

type DemoChildSeed = {
  bookingId: string;
  bookingReference: string;
  childName: string;
  childAge: number;
  dateOfBirth?: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string;
  allergies: string;
  medicationNotes: string;
  photoConsent: PhotoConsentStatus;
  paymentStatus: CustomerPaymentStatus;
  bookingStatus?: BookingStatus;
  pricePaid: number;
  ticketType?: string;
  bookingQuestionAnswers: BookingQuestionAnswer[];
  defaultAttendance?: AttendanceStatus;
  /** Per-date overrides — omit to inherit booking-level status */
  dateStatuses?: Record<
    string,
    { bookingStatus: BookingStatus; paymentStatus: CustomerPaymentStatus }
  >;
};

export const DEMO_REGISTER_CHILDREN: DemoChildSeed[] = [
  {
    bookingId: "demo-reg-001",
    bookingReference: "PV-2026-0041",
    childName: "Ava Thompson",
    childAge: 9,
    dateOfBirth: "2017-03-14",
    parentName: "Emma Thompson",
    parentEmail: "emma.thompson@example.com",
    parentPhone: "07700 900 101",
    emergencyContactName: "James Thompson",
    emergencyContactPhone: "07700 900 102",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "present",
  },
  {
    bookingId: "demo-reg-002",
    bookingReference: "PV-2026-0042",
    childName: "Noah Patel",
    childAge: 10,
    parentName: "Raj Patel",
    parentEmail: "raj.patel@example.com",
    parentPhone: "07700 900 202",
    emergencyContactName: "Raj Patel",
    emergencyContactPhone: "07700 900 202",
    medicalConditions: "",
    allergies: "Peanuts",
    medicationNotes: "EpiPen in sports bag",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "present",
  },
  {
    bookingId: "demo-reg-003",
    bookingReference: "PV-2026-0043",
    childName: "Isla Williams",
    childAge: 8,
    parentName: "Sarah Williams",
    parentEmail: "sarah.williams@example.com",
    parentPhone: "07700 900 303",
    emergencyContactName: "Mark Williams",
    emergencyContactPhone: "07700 900 304",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "not_allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "present",
  },
  {
    bookingId: "demo-reg-004",
    bookingReference: "PV-2026-0044",
    childName: "Leo Ahmed",
    childAge: 11,
    parentName: "Aisha Ahmed",
    parentEmail: "aisha.ahmed@example.com",
    parentPhone: "07700 900 404",
    emergencyContactName: "Hassan Ahmed",
    emergencyContactPhone: "07700 900 405",
    medicalConditions: "Asthma",
    allergies: "",
    medicationNotes: "Blue inhaler before warm-up if wheezy",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "late",
  },
  {
    bookingId: "demo-reg-005",
    bookingReference: "PV-2026-0045",
    childName: "Grace Johnson",
    childAge: 9,
    parentName: "Helen Johnson",
    parentEmail: "helen.johnson@example.com",
    parentPhone: "07700 900 505",
    emergencyContactName: "Helen Johnson",
    emergencyContactPhone: "07700 900 505",
    medicalConditions: "",
    allergies: "Dairy",
    medicationNotes: "",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "present",
  },
  {
    bookingId: "demo-reg-006",
    bookingReference: "PV-2026-0046",
    childName: "Oliver Brown",
    childAge: 10,
    parentName: "David Brown",
    parentEmail: "david.brown@example.com",
    parentPhone: "07700 900 606",
    emergencyContactName: "Kate Brown",
    emergencyContactPhone: "07700 900 607",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "unknown",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "present",
  },
  {
    bookingId: "demo-reg-007",
    bookingReference: "PV-2026-0047",
    childName: "Mia Clarke",
    childAge: 8,
    parentName: "Rachel Clarke",
    parentEmail: "rachel.clarke@example.com",
    parentPhone: "07700 900 707",
    emergencyContactName: "Chris Clarke",
    emergencyContactPhone: "07700 900 708",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "absent",
  },
  {
    bookingId: "demo-reg-008",
    bookingReference: "PV-2026-0048",
    childName: "Ethan Wilson",
    childAge: 12,
    parentName: "Claire Wilson",
    parentEmail: "claire.wilson@example.com",
    parentPhone: "07700 900 808",
    emergencyContactName: "Claire Wilson",
    emergencyContactPhone: "07700 900 808",
    medicalConditions: "ADHD",
    allergies: "",
    medicationNotes: "Medication taken before session",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "present",
  },
  {
    bookingId: "demo-reg-009",
    bookingReference: "PV-2026-0049",
    childName: "Sofia Robinson",
    childAge: 9,
    parentName: "Laura Robinson",
    parentEmail: "laura.robinson@example.com",
    parentPhone: "07700 900 909",
    emergencyContactName: "Tom Robinson",
    emergencyContactPhone: "07700 900 910",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "not_allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "present",
  },
  {
    bookingId: "demo-reg-010",
    bookingReference: "PV-2026-0050",
    childName: "Jacob Taylor",
    childAge: 10,
    parentName: "Kate Taylor",
    parentEmail: "kate.taylor@example.com",
    parentPhone: "07700 900 911",
    emergencyContactName: "Kate Taylor",
    emergencyContactPhone: "07700 900 911",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    defaultAttendance: "not_marked",
  },
];

export function countDemoRegisterChildren(): number {
  return DEMO_REGISTER_CHILDREN.filter((seed) =>
    isIncludedOnRegister({
      bookingStatus: seed.bookingStatus ?? "confirmed",
      paymentStatus: seed.paymentStatus,
    }),
  ).length;
}

export const DEMO_REGISTER_CHILD_COUNT = countDemoRegisterChildren();

export const DEMO_BLOCK_SESSION_OPTION: RegisterSessionOption = {
  id: `${DEMO_BLOCK_SESSION_ID}__2026-06-18__16:00`,
  sessionId: DEMO_BLOCK_SESSION_ID,
  activityTitle: DEMO_BLOCK_ACTIVITY_TITLE,
  venue: "Riverside Sports Hall",
  date: "2026-06-18",
  startTime: "16:00",
  endTime: "17:30",
  day: "Thursday",
  bookingStructure: "block",
  capacity: 16,
  isBlock: true,
};

function seedToEntry(
  seed: DemoChildSeed,
  registerSession: RegisterSessionOption,
  attendance: AttendanceStatus,
  notes: string,
): RegisterChildEntry {
  const hasMedicalFlag = Boolean(
    seed.medicalConditions.trim() ||
      seed.allergies.trim() ||
      seed.medicationNotes.trim(),
  );

  return {
    bookingId: seed.bookingId,
    bookingReference: seed.bookingReference,
    childName: seed.childName,
    childAge: seed.childAge,
    parentName: seed.parentName,
    parentEmail: seed.parentEmail,
    parentPhone: seed.parentPhone,
    emergencyContact: seed.emergencyContactPhone,
    emergencyContactName: seed.emergencyContactName,
    emergencyContactPhone: seed.emergencyContactPhone,
    hasMedicalFlag,
    medicalConditions: seed.medicalConditions,
    allergies: seed.allergies,
    medicationNotes: seed.medicationNotes,
    photoConsent: seed.photoConsent,
    hasBookingQuestions: seed.bookingQuestionAnswers.length > 0,
    bookingQuestionAnswers: seed.bookingQuestionAnswers,
    paymentStatus: seed.paymentStatus,
    pricePaid: seed.pricePaid,
    sessionTitle: registerSession.activityTitle,
    isDemo: true,
    attendance,
    notes,
  };
}

function resolveDateStatus(
  seed: DemoChildSeed,
  date: string,
): { bookingStatus: BookingStatus; paymentStatus: CustomerPaymentStatus } {
  const override = seed.dateStatuses?.[date];
  if (override) return override;
  return {
    bookingStatus: seed.bookingStatus ?? "confirmed",
    paymentStatus: seed.paymentStatus,
  };
}

function resolveDemoAttendance(
  seed: DemoChildSeed,
  saved: { attendance: AttendanceStatus; notes: string } | undefined,
): AttendanceStatus {
  if (saved?.attendance) return saved.attendance;
  return seed.defaultAttendance ?? "not_marked";
}

export function isDemoBlockSession(sessionId: string): boolean {
  return sessionId === DEMO_BLOCK_SESSION_ID;
}

export function isDemoRegisterSessionId(registerSessionId: string): boolean {
  return registerSessionId.startsWith(`${DEMO_BLOCK_SESSION_ID}__`);
}

export function buildDemoBlockSessionDates(
  buildRegisterSessionId: (sessionId: string, date: string, startTime: string) => string,
  formatShortDateLabel: (date: string) => string,
  formatFullDateLabel: (date: string) => string,
): RegisterSessionDate[] {
  return DEMO_BLOCK_DATES.map((slot) => ({
    date: slot.date,
    dateLabel: formatFullDateLabel(slot.date),
    shortDateLabel: formatShortDateLabel(slot.date),
    registerSessionId: buildRegisterSessionId(
      DEMO_BLOCK_SESSION_ID,
      slot.date,
      slot.startTime,
    ),
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

export function getDemoBlockSessionOptions(): RegisterSessionOption[] {
  return DEMO_BLOCK_DATES.map((slot) => ({
    id: `${DEMO_BLOCK_SESSION_ID}__${slot.date}__${slot.startTime}`,
    sessionId: DEMO_BLOCK_SESSION_ID,
    activityTitle: DEMO_BLOCK_ACTIVITY_TITLE,
    venue: "Riverside Sports Hall",
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    day: "Thursday",
    bookingStructure: "block" as const,
    capacity: 16,
    isBlock: true,
  }));
}

export function buildDemoRegisterEntries(
  registerSession: RegisterSessionOption,
  attendanceByBookingId: Record<
    string,
    { attendance: AttendanceStatus; notes: string }
  >,
): RegisterChildEntry[] {
  return DEMO_REGISTER_CHILDREN.filter((seed) =>
    isIncludedOnRegister({
      bookingStatus: seed.bookingStatus ?? "confirmed",
      paymentStatus: seed.paymentStatus,
    }),
  ).map((seed) => {
    const saved = attendanceByBookingId[seed.bookingId];
    return seedToEntry(
      seed,
      registerSession,
      resolveDemoAttendance(seed, saved),
      saved?.notes ?? "",
    );
  });
}

export function buildDemoRegisterGridChildren(
  sessionDates: RegisterSessionDate[],
  attendanceBySessionAndBooking: Record<
    string,
    Record<string, { attendance: AttendanceStatus; notes: string }>
  >,
  registerSession: RegisterSessionOption,
): RegisterGridChild[] {
  const rows: RegisterGridChild[] = [];

  for (const seed of DEMO_REGISTER_CHILDREN) {
    const activeByDate: Record<string, boolean> = {};
    const statusByDate: RegisterGridChild["statusByDate"] = {};
    const attendanceByDate: Record<string, AttendanceStatus> = {};
    const visibleSessionDates: RegisterSessionDate[] = [];

    for (const sessionDate of sessionDates) {
      const status = resolveDateStatus(seed, sessionDate.date);
      statusByDate[sessionDate.registerSessionId] = status;
      const active = isIncludedOnRegister(status);
      activeByDate[sessionDate.registerSessionId] = active;

      if (active) {
        visibleSessionDates.push({
          ...sessionDate,
          bookingStatus: status.bookingStatus,
          paymentStatus: status.paymentStatus,
        });
      }

      const saved =
        attendanceBySessionAndBooking[sessionDate.registerSessionId]?.[
          seed.bookingId
        ];
      attendanceByDate[sessionDate.registerSessionId] = resolveDemoAttendance(
        seed,
        saved,
      );
    }

    const hasAnyActiveDate = Object.values(activeByDate).some(Boolean);
    if (!hasAnyActiveDate) {
      continue;
    }

    const primaryDateId =
      visibleSessionDates[0]?.registerSessionId ??
      sessionDates[0]?.registerSessionId ??
      "";
    const entry = seedToEntry(
      seed,
      registerSession,
      attendanceByDate[primaryDateId] ?? "not_marked",
      attendanceBySessionAndBooking[primaryDateId]?.[seed.bookingId]?.notes ??
        "",
    );

    rows.push({
      ...entry,
      ticketType: seed.ticketType,
      dateOfBirth: seed.dateOfBirth,
      sessionDates: visibleSessionDates,
      attendanceByDate,
      activeByDate,
      statusByDate,
    });
  }

  return rows;
}

export function getDemoBlockSessionOption(): RegisterSessionOption {
  return DEMO_BLOCK_SESSION_OPTION;
}
