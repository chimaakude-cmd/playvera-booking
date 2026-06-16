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
    childName: "Mia Carter",
    childAge: 8,
    dateOfBirth: "2018-06-20",
    parentName: "Helen Carter",
    parentEmail: "helen.carter@example.com",
    parentPhone: "07700 900 101",
    emergencyContactName: "Tom Carter",
    emergencyContactPhone: "07700 900 102",
    medicalConditions: "",
    allergies: "Peanuts, tree nuts",
    medicationNotes: "EpiPen in sports bag",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 18,
    ticketType: "Full term",
    bookingQuestionAnswers: [
      {
        questionId: "q-additional",
        key: "additional_needs",
        label: "Additional needs",
        value: "None",
        showOnRegister: true,
      },
    ],
  },
  {
    bookingId: "demo-reg-002",
    bookingReference: "PV-2026-0042",
    childName: "Noah Okonkwo",
    childAge: 10,
    parentName: "James Okonkwo",
    parentEmail: "james.okonkwo@example.com",
    parentPhone: "07700 900 202",
    emergencyContactName: "James Okonkwo",
    emergencyContactPhone: "07700 900 202",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 18,
    ticketType: "Full term",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-003",
    bookingReference: "PV-2026-0043",
    childName: "Ella Mitchell",
    childAge: 7,
    parentName: "Sarah Mitchell",
    parentEmail: "sarah.mitchell@example.com",
    parentPhone: "07700 900 303",
    emergencyContactName: "Mark Mitchell",
    emergencyContactPhone: "07700 900 304",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "not_allowed",
    paymentStatus: "pending",
    pricePaid: 18,
    ticketType: "Trial session",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-004",
    bookingReference: "PV-2026-0044",
    childName: "Leo Mitchell",
    childAge: 9,
    parentName: "Sarah Mitchell",
    parentEmail: "sarah.mitchell@example.com",
    parentPhone: "07700 900 303",
    emergencyContactName: "Mark Mitchell",
    emergencyContactPhone: "07700 900 304",
    medicalConditions: "Asthma",
    allergies: "",
    medicationNotes: "Blue inhaler before warm-up if wheezy",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 18,
    ticketType: "Full term",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-005",
    bookingReference: "PV-2026-0045",
    childName: "Amelia Hughes",
    childAge: 6,
    parentName: "David Hughes",
    parentEmail: "david.hughes@example.com",
    parentPhone: "07700 900 404",
    emergencyContactName: "Emma Hughes",
    emergencyContactPhone: "07700 900 405",
    medicalConditions: "",
    allergies: "Dairy",
    medicationNotes: "",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 15,
    ticketType: "Full term",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-006",
    bookingReference: "PV-2026-0046",
    childName: "Arjun Sharma",
    childAge: 11,
    parentName: "Priya Sharma",
    parentEmail: "priya.sharma@example.com",
    parentPhone: "07700 900 505",
    emergencyContactName: "Priya Sharma",
    emergencyContactPhone: "07700 900 505",
    medicalConditions: "Type 1 diabetes",
    allergies: "",
    medicationNotes: "Blood glucose check at break; snacks in bag",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 20,
    ticketType: "Full term",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-007",
    bookingReference: "PV-2026-0047",
    childName: "Olivia Bennett",
    childAge: 8,
    parentName: "Rachel Bennett",
    parentEmail: "rachel.bennett@example.com",
    parentPhone: "07700 900 606",
    emergencyContactName: "Chris Bennett",
    emergencyContactPhone: "07700 900 607",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "unknown",
    paymentStatus: "refunded",
    bookingStatus: "cancelled",
    pricePaid: 18,
    ticketType: "Full term",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-008",
    bookingReference: "PV-2026-0048",
    childName: "Finn Walsh",
    childAge: 9,
    parentName: "Claire Walsh",
    parentEmail: "claire.walsh@example.com",
    parentPhone: "07700 900 707",
    emergencyContactName: "Claire Walsh",
    emergencyContactPhone: "07700 900 707",
    medicalConditions: "ADHD",
    allergies: "",
    medicationNotes: "Medication taken before session",
    photoConsent: "allowed",
    paymentStatus: "partial_refund",
    pricePaid: 18,
    ticketType: "Full term",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-009",
    bookingReference: "PV-2026-0049",
    childName: "Zara Ahmed",
    childAge: 10,
    parentName: "Aisha Ahmed",
    parentEmail: "aisha.ahmed@example.com",
    parentPhone: "07700 900 808",
    emergencyContactName: "Hassan Ahmed",
    emergencyContactPhone: "07700 900 809",
    medicalConditions: "",
    allergies: "Shellfish",
    medicationNotes: "",
    photoConsent: "not_allowed",
    paymentStatus: "paid",
    pricePaid: 18,
    ticketType: "Full term",
    bookingQuestionAnswers: [],
  },
  {
    bookingId: "demo-reg-010",
    bookingReference: "PV-2026-0050",
    childName: "Ruby Taylor",
    childAge: 8,
    parentName: "Kate Taylor",
    parentEmail: "kate.taylor@example.com",
    parentPhone: "07700 900 909",
    emergencyContactName: "Kate Taylor",
    emergencyContactPhone: "07700 900 909",
    medicalConditions: "",
    allergies: "",
    medicationNotes: "",
    photoConsent: "allowed",
    paymentStatus: "paid",
    pricePaid: 72,
    ticketType: "Block — 4 weeks",
    bookingQuestionAnswers: [],
    dateStatuses: {
      "2026-07-02": { bookingStatus: "cancelled", paymentStatus: "refunded" },
    },
  },
];

export const DEMO_REGISTER_CHILD_COUNT = DEMO_REGISTER_CHILDREN.length;

export const DEMO_BLOCK_SESSION_OPTION: RegisterSessionOption = {
  id: `${DEMO_BLOCK_SESSION_ID}__2026-06-18__16:00`,
  sessionId: DEMO_BLOCK_SESSION_ID,
  activityTitle: "Summer Skills Block (Demo)",
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

export function isDemoBlockSession(sessionId: string): boolean {
  return sessionId === DEMO_BLOCK_SESSION_ID;
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
      saved?.attendance ?? "not_marked",
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
      attendanceByDate[sessionDate.registerSessionId] =
        saved?.attendance ?? "not_marked";
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
