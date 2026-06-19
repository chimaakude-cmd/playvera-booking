import {
  AttendeeCriteria,
  createDefaultAttendeeCriteria,
  formatAttendeePreview,
  validateAttendeeCriteria,
} from "./attendee-criteria";
import {
  createDefaultBookingQuestions,
  type BookingQuestionConfig,
} from "./booking-questions";
import { loadClubProfile } from "./club/new-club-mode";
import { hasStoredImage } from "./session-images";
import {
  buildSessionLocationLabel,
  initialSessionVenueForm,
  SessionVenueForm,
  validateSessionVenueForm,
  venueFormToSessionVenue,
} from "./session-location";
import { PLATFORM_FEE_PERCENT, formatMoney, resolvePlatformFeePercent } from "./payments";
import {
  BookingStructureType,
  CalendarViewMode,
  CapacityApplyScope,
  ClubSession,
  ConfirmationEmailSettings,
  RepeatFrequency,
  ScheduleMode,
  SessionDateSlot,
  SessionSchedule,
  SessionTicket,
  TicketPriceType,
} from "./sessions";

/** Session ticket subscriptions are not billed yet (provider GoCardless only). */
export const SESSION_TICKET_SUBSCRIPTION_ENABLED = false;

export type TicketPaymentType = "one_off" | "monthly_subscription" | "free_session";

export function toTicketPaymentType(
  priceType: TicketPriceType,
): TicketPaymentType {
  if (priceType === "free" || priceType === "free_trial") {
    return "free_session";
  }
  if (priceType === "subscription") {
    return "monthly_subscription";
  }
  return "one_off";
}

export function fromTicketPaymentType(
  paymentType: TicketPaymentType,
  bookingStructure: BookingStructureType | null,
): TicketPriceType {
  switch (paymentType) {
    case "free_session":
      return "free";
    case "monthly_subscription":
      return "subscription";
    case "one_off":
      return bookingStructure === "block" ? "term_block" : "per_session";
  }
}

export function parsePriceFromTicketName(name: string): number | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const poundMatch = trimmed.match(/£\s*(\d+(?:\.\d{1,2})?)/);
  if (poundMatch) {
    return Number(poundMatch[1]);
  }

  const dashMatch = trimmed.match(/[–-]\s*£?\s*(\d+(?:\.\d{1,2})?)\s*$/);
  if (dashMatch) {
    return Number(dashMatch[1]);
  }

  const trailingAmount = trimmed.match(/(\d+(?:\.\d{1,2})?)\s*(?:pounds?|gbp)\b/i);
  if (trailingAmount) {
    return Number(trailingAmount[1]);
  }

  return null;
}

export function isTicketPriceEditable(priceType: TicketPriceType): boolean {
  return (
    priceType !== "free" &&
    priceType !== "free_trial" &&
    priceType !== "subscription"
  );
}

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type WizardFormData = {
  bookingStructure: BookingStructureType | null;
  sessionTitle: string;
  description: string;
  attendeeCriteria: AttendeeCriteria;
  mainImage: string | null;
  extraImages: string[];
  parentsBring: string;
  clubProvides: string;
  venue: SessionVenueForm;
  schedule: SessionSchedule;
  defaultCapacity: number;
  capacityApplyScope: CapacityApplyScope;
  selectedCapacityDateId: string | null;
  tickets: SessionTicket[];
  confirmationEmail: ConfirmationEmailSettings;
  bookingQuestions: BookingQuestionConfig[];
};

export const WIZARD_STEP_LABELS = [
  "Booking Structure",
  "Session Details",
  "Location",
  "Schedule",
  "Capacity",
  "Tickets",
  "Parent Email",
  "Booking Questions",
  "Review",
] as const;

export const initialWizardFormData: WizardFormData = {
  bookingStructure: null,
  sessionTitle: "",
  description: "",
  attendeeCriteria: createDefaultAttendeeCriteria(),
  mainImage: null,
  extraImages: [],
  parentsBring: "",
  clubProvides: "",
  venue: initialSessionVenueForm,
  schedule: {
    mode: "single_dates",
    calendarView: "month",
    dates: [],
    offDays: [],
    exceptionDates: [],
    defaultStartTime: "15:30",
    defaultEndTime: "16:30",
    repeatFrequency: "weekly",
    repeatStartDate: "",
    repeatEndDate: "",
    repeatDayOfWeek: "tuesday",
    blockStartDate: "",
    blockEndDate: "",
    blockDayOfWeek: "tuesday",
  },
  defaultCapacity: 20,
  capacityApplyScope: "this_session",
  selectedCapacityDateId: null,
  tickets: [],
  confirmationEmail: {
    confirmationImage: null,
    welcomeMessage: "",
    extraInformation: "",
  },
  bookingQuestions: createDefaultBookingQuestions(),
};

const dayNameToIndex: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateToDayName(dateString: string): string {
  const date = parseDate(dateString);
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()];
}

export function getActiveWizardDates(data: WizardFormData): SessionDateSlot[] {
  return data.schedule.dates
    .filter((date) => !date.cancelled)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function isScheduleDateBlocked(
  date: string,
  offDays: string[],
  exceptionDates: string[],
): boolean {
  return offDays.includes(date) || exceptionDates.includes(date);
}

function createDateSlot(
  date: string,
  startTime: string,
  endTime: string,
  capacity: number,
): SessionDateSlot {
  return {
    id: crypto.randomUUID(),
    date,
    startTime,
    endTime,
    capacity,
  };
}

function mergeUniqueDates(
  existing: SessionDateSlot[],
  generated: SessionDateSlot[],
): SessionDateSlot[] {
  const map = new Map(existing.map((date) => [date.date, date]));
  generated.forEach((date) => {
    if (!map.has(date.date)) {
      map.set(date.date, date);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function generateRepeatSchedule(
  schedule: SessionSchedule,
  defaultCapacity: number,
): SessionDateSlot[] {
  const {
    repeatFrequency,
    repeatStartDate,
    repeatEndDate,
    repeatDayOfWeek,
    defaultStartTime,
    defaultEndTime,
    offDays,
    exceptionDates,
  } = schedule;

  if (!repeatStartDate || !repeatEndDate) {
    return [];
  }

  const start = parseDate(repeatStartDate);
  const end = parseDate(repeatEndDate);
  if (start > end) {
    return [];
  }

  const dates: SessionDateSlot[] = [];

  if (repeatFrequency === "monthly") {
    const dayOfMonth = start.getDate();
    let current = new Date(start);

    while (current <= end) {
      const key = formatDateKey(current);
      if (!isScheduleDateBlocked(key, offDays, exceptionDates)) {
        dates.push(
          createDateSlot(key, defaultStartTime, defaultEndTime, defaultCapacity),
        );
      }

      const next = new Date(current);
      next.setMonth(next.getMonth() + 1);
      const lastDay = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();
      next.setDate(Math.min(dayOfMonth, lastDay));
      current = next;
    }

    return dates;
  }

  const targetDay = dayNameToIndex[repeatDayOfWeek];
  const current = new Date(start);

  while (current <= end) {
    const matchesDay =
      repeatFrequency === "weekly" || repeatFrequency === "fortnightly"
        ? current.getDay() === targetDay
        : false;

    if (matchesDay) {
      const key = formatDateKey(current);
      if (!isScheduleDateBlocked(key, offDays, exceptionDates)) {
        dates.push(
          createDateSlot(key, defaultStartTime, defaultEndTime, defaultCapacity),
        );
      }

      current.setDate(
        current.getDate() + (repeatFrequency === "fortnightly" ? 14 : 7),
      );
      continue;
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function generateBlockSchedule(
  schedule: SessionSchedule,
  defaultCapacity: number,
): SessionDateSlot[] {
  const {
    blockStartDate,
    blockEndDate,
    blockDayOfWeek,
    defaultStartTime,
    defaultEndTime,
    offDays,
    exceptionDates,
  } = schedule;

  if (!blockStartDate || !blockEndDate) {
    return [];
  }

  const targetDay = dayNameToIndex[blockDayOfWeek];
  const start = parseDate(blockStartDate);
  const end = parseDate(blockEndDate);
  if (start > end) {
    return [];
  }

  const dates: SessionDateSlot[] = [];
  const current = new Date(start);

  while (current <= end) {
    if (current.getDay() === targetDay) {
      const key = formatDateKey(current);
      if (!isScheduleDateBlocked(key, offDays, exceptionDates)) {
        dates.push(
          createDateSlot(key, defaultStartTime, defaultEndTime, defaultCapacity),
        );
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function addSingleDateToSchedule(
  schedule: SessionSchedule,
  date: string,
  defaultCapacity: number,
): SessionSchedule {
  if (
    isScheduleDateBlocked(date, schedule.offDays, schedule.exceptionDates) ||
    schedule.dates.some((slot) => slot.date === date && !slot.cancelled)
  ) {
    return schedule;
  }

  return {
    ...schedule,
    dates: mergeUniqueDates(schedule.dates, [
      createDateSlot(
        date,
        schedule.defaultStartTime,
        schedule.defaultEndTime,
        defaultCapacity,
      ),
    ]),
  };
}

export function applyCapacityWithScope(
  dates: SessionDateSlot[],
  targetDateId: string | null,
  capacity: number,
  scope: CapacityApplyScope,
): SessionDateSlot[] {
  if (scope === "entire_block") {
    return dates.map((date) => ({ ...date, capacity }));
  }

  if (!targetDateId) {
    return dates.map((date) => ({ ...date, capacity }));
  }

  const target = dates.find((date) => date.id === targetDateId);
  if (!target) {
    return dates;
  }

  if (scope === "this_session") {
    return dates.map((date) =>
      date.id === targetDateId ? { ...date, capacity } : date,
    );
  }

  return dates.map((date) =>
    date.date >= target.date ? { ...date, capacity } : date,
  );
}

export function getRemainingSessionCount(
  dates: SessionDateSlot[],
  fromDate = formatDateKey(new Date()),
): number {
  return dates.filter((date) => !date.cancelled && date.date >= fromDate).length;
}

export function calculateRemainingSessionCost(
  perSessionPrice: number,
  dates: SessionDateSlot[],
): number {
  const remaining = getRemainingSessionCount(dates);
  return Math.round(perSessionPrice * remaining * 100) / 100;
}

export function createEmptyTicket(): SessionTicket {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    priceType: "per_session",
    price: 0,
    lowSpacesTrigger: true,
    recentBookingFlag: false,
  };
}

export function getCalendarCells(
  anchorDate: string,
  view: CalendarViewMode,
): Array<{ date: string; inRange: boolean }> {
  const anchor = parseDate(anchorDate || formatDateKey(new Date()));

  if (view === "week") {
    const day = anchor.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(anchor);
    start.setDate(anchor.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      return { date: formatDateKey(current), inRange: true };
    });
  }

  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startDay = firstOfMonth.getDay();
  const mondayBasedStart = startDay === 0 ? -6 : 1 - startDay;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() + mondayBasedStart);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    return {
      date: formatDateKey(current),
      inRange: current.getMonth() === anchor.getMonth(),
    };
  });
}

export function validateWizardStep(
  step: WizardStep,
  data: WizardFormData,
): string[] {
  const errors: string[] = [];

  if (step === 0) {
    if (!data.bookingStructure) {
      errors.push("Select a booking structure to continue");
    }
  }

  if (step === 1) {
    if (!data.sessionTitle.trim()) errors.push("Session name is required");
    if (!data.description.trim()) errors.push("Session description is required");
    if (!data.mainImage || !hasStoredImage(data.mainImage)) {
      errors.push("Main session image is required");
    }
    if (!data.parentsBring.trim()) {
      errors.push("What children should bring is required");
    }
    if (!data.clubProvides.trim()) {
      errors.push("What the club provides is required");
    }
    errors.push(...validateAttendeeCriteria(data.attendeeCriteria));
  }

  if (step === 2) {
    errors.push(...validateSessionVenueForm(data.venue));
  }

  if (step === 3) {
    if (getActiveWizardDates(data).length === 0) {
      errors.push("Add at least one session date to the calendar");
    }
  }

  if (step === 4) {
    if (data.defaultCapacity < 1) {
      errors.push("Default capacity must be at least 1");
    }
    if (getActiveWizardDates(data).some((date) => date.capacity < 1)) {
      errors.push("Each session date needs a capacity of at least 1");
    }
  }

  if (step === 5) {
    if (data.tickets.length === 0) {
      errors.push("Add at least one ticket");
    }

    data.tickets.forEach((ticket, index) => {
      const label = `Ticket ${index + 1}`;
      if (!ticket.name.trim()) errors.push(`${label}: name is required`);
      if (!ticket.description.trim()) {
        errors.push(`${label}: description is required`);
      }
      if (
        ticket.priceType !== "free" &&
        ticket.priceType !== "free_trial" &&
        ticket.priceType !== "subscription" &&
        ticket.price <= 0
      ) {
        errors.push(`${label}: price amount must be greater than 0`);
      }
    });
  }

  if (step === 6) {
    const profile = loadClubProfile();
    const clubPhone = profile.contact.phone.trim();
    const clubEmail = profile.contact.email.trim();

    if (!clubPhone || !clubEmail) {
      errors.push(
        "Please complete your club profile contact details before publishing this session.",
      );
    }
    if (
      !data.confirmationEmail.confirmationImage ||
      !hasStoredImage(data.confirmationEmail.confirmationImage)
    ) {
      errors.push("Confirmation email image is required");
    }
    if (!data.confirmationEmail.welcomeMessage.trim()) {
      errors.push("Welcome message is required");
    }
    if (!data.confirmationEmail.extraInformation.trim()) {
      errors.push("Extra information for parents is required");
    }
  }

  if (step === 7) {
    const enabled = data.bookingQuestions.filter((q) => q.enabled);
    enabled.forEach((question, index) => {
      if (!question.label.trim()) {
        errors.push(`Question ${index + 1}: question text is required`);
      }
      if (
        question.answerType === "multiple_choice" &&
        (!question.choices?.length || question.choices.every((c) => !c.trim()))
      ) {
        errors.push(`Question ${index + 1}: add at least one choice`);
      }
    });
  }

  return errors;
}

export function validateWizardForPublish(data: WizardFormData): string[] {
  const errors: string[] = [];

  for (let step = 0; step < WIZARD_STEP_LABELS.length; step += 1) {
    errors.push(...validateWizardStep(step as WizardStep, data));
  }

  return errors;
}

function getPrimaryTicketPrice(tickets: SessionTicket[]): number {
  const paidTicket = tickets.find(
    (ticket) =>
      ticket.priceType === "term_block" || ticket.priceType === "per_session",
  );
  return paidTicket?.price ?? 0;
}

function getPrimaryTicket(tickets: SessionTicket[]): SessionTicket | undefined {
  return (
    tickets.find((ticket) => ticket.priceType === "term_block") ??
    tickets.find((ticket) => ticket.priceType === "per_session") ??
    tickets[0]
  );
}

export function compileWizardToSession(
  data: WizardFormData,
): Omit<ClubSession, "id" | "bookings" | "createdAt"> {
  const activeDates = getActiveWizardDates(data);
  const firstDate = activeDates[0];
  const capacities = activeDates.map((date) => date.capacity);
  const minCapacity = capacities.length ? Math.min(...capacities) : data.defaultCapacity;
  const maxCapacity = capacities.length ? Math.max(...capacities) : data.defaultCapacity;
  const attendeePreview = formatAttendeePreview(data.attendeeCriteria);
  const venue = venueFormToSessionVenue(data.venue);

  const schedule: SessionSchedule = {
    ...data.schedule,
    dates: activeDates,
    bookingType:
      data.bookingStructure === "individual" ? "single" : "block",
  };

  const profile = loadClubProfile();
  const clubPhone = profile.contact.phone.trim();
  const clubEmail = profile.contact.email.trim();

  return {
    sessionTitle: data.sessionTitle.trim(),
    description: data.description.trim(),
    ageRange: attendeePreview,
    activityType: "camps",
    location: buildSessionLocationLabel(venue),
    venue,
    day: firstDate ? dateToDayName(firstDate.date) : "monday",
    startTime: firstDate?.startTime ?? data.schedule.defaultStartTime,
    endTime: firstDate?.endTime ?? data.schedule.defaultEndTime,
    price: getPrimaryTicketPrice(data.tickets),
    capacity: maxCapacity,
    providerStripeAccountId: "",
    platformFeePercent: resolvePlatformFeePercent(),
    bookingStructure: data.bookingStructure ?? "individual",
    details: {
      description: data.description.trim(),
      ageGroup: attendeePreview,
      attendeeCriteria: data.attendeeCriteria,
      images: {
        mainImage: data.mainImage,
        extraImages: data.extraImages,
      },
      parentsBring: data.parentsBring.trim(),
      clubProvides: data.clubProvides.trim(),
    },
    schedule,
    defaultCapacity: data.defaultCapacity,
    tickets: data.tickets,
    confirmationEmail: {
      confirmationImage: data.confirmationEmail.confirmationImage,
      welcomeMessage: data.confirmationEmail.welcomeMessage.trim(),
      extraInformation: data.confirmationEmail.extraInformation.trim(),
      clubContactDetails: clubPhone || undefined,
      replyToEmail: clubEmail || undefined,
    },
    bookingQuestions: data.bookingQuestions.filter((q) => q.enabled),
    ticketSummaryPrimaryId: getPrimaryTicket(data.tickets)?.id,
    minSessionCapacity: minCapacity,
    maxSessionCapacity: maxCapacity,
    published: true,
    providerVenueId: data.venue.providerVenueId,
  };
}

export async function saveWizardSession(data: WizardFormData) {
  const { saveSessionWithMeta } = await import("@/lib/data");
  const sessionInput = compileWizardToSession(data);
  return saveSessionWithMeta(sessionInput);
}

export function formatSessionDateLabel(dateString: string): string {
  return parseDate(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatSessionTimeLabel(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}

export function summarizeTickets(data: WizardFormData): string {
  if (!data.tickets.length) {
    return "No tickets";
  }

  return data.tickets
    .map((ticket) => {
      if (
        ticket.priceType === "free" ||
        ticket.priceType === "free_trial" ||
        ticket.priceType === "subscription"
      ) {
        if (ticket.priceType === "subscription") {
          return `${ticket.name}: Monthly subscription (coming soon)`;
        }
        return `${ticket.name}: Free`;
      }

      if (ticket.priceType === "term_block") {
        return `${ticket.name}: ${formatMoney(ticket.price)} block`;
      }

      const remaining = calculateRemainingSessionCost(
        ticket.price,
        getActiveWizardDates(data),
      );
      return `${ticket.name}: ${formatMoney(ticket.price)}/session (${formatMoney(remaining)} remaining)`;
    })
    .join(" · ");
}

export { formatAttendeePreview, formatMoney };
