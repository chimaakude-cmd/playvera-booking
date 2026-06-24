/**
 * Club session types and localStorage helpers.
 *
 * Session listing and persistence use Supabase (see lib/data/).
 * localStorage is retained only for one-time migration of legacy sessions
 * (see lib/data/local-session-import.ts).
 */
export type SessionDateSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  cancelled?: boolean;
};

export type BookingStructureType = "individual" | "block" | "subscription";

export type ScheduleMode = "single_dates" | "repeat" | "block";

export type RepeatFrequency = "weekly" | "fortnightly" | "monthly";

export type CalendarViewMode = "month" | "week";

export type CapacityApplyScope =
  | "this_session"
  | "future_sessions"
  | "entire_block";

export type SessionSchedule = {
  mode: ScheduleMode;
  calendarView: CalendarViewMode;
  dates: SessionDateSlot[];
  offDays: string[];
  exceptionDates: string[];
  defaultStartTime: string;
  defaultEndTime: string;
  repeatFrequency: RepeatFrequency;
  repeatStartDate: string;
  repeatEndDate: string;
  repeatDayOfWeek: string;
  blockStartDate: string;
  blockEndDate: string;
  blockDayOfWeek: string;
  /** @deprecated legacy field */
  bookingType?: "single" | "block";
  /** Recurring billing settings when bookingStructure is subscription. */
  subscriptionConfig?: import("./session-wizard/payment-model").SessionSubscriptionConfig;
};

export type TicketPriceType =
  | "free"
  | "term_block"
  | "per_session"
  | "free_trial"
  | "subscription";

export type TicketSubscriptionBilling = {
  billingStartDate?: string;
  billingDay?: number | null;
  trialDays?: number | null;
  cancelAnytime?: boolean;
  minimumCommitmentMonths?: number | null;
};

export type SessionTicket = {
  id: string;
  name: string;
  description: string;
  priceType: TicketPriceType;
  price: number;
  lowSpacesTrigger: boolean;
  recentBookingFlag: boolean;
  subscriptionBilling?: TicketSubscriptionBilling;
};

import type { SessionVenue } from "./session-location";

/** Public Supabase Storage URLs or localStorage image ids (fallback). */
export type SessionImages = {
  mainImage: string | null;
  extraImages: string[];
};

import type { AttendeeCriteria } from "./attendee-criteria";

export type SessionWizardDetails = {
  description: string;
  ageGroup: string;
  attendeeCriteria?: AttendeeCriteria;
  images: SessionImages;
  parentsBring: string;
  clubProvides: string;
};

export type ConfirmationEmailSettings = {
  confirmationImage: string | null;
  welcomeMessage: string;
  extraInformation: string;
  clubContactDetails?: string;
  replyToEmail?: string;
};

export type ClubSession = {
  id: string;
  sessionTitle: string;
  activityType: string;
  location: string;
  day: string;
  startTime: string;
  endTime: string;
  price: number;
  capacity: number;
  ageRange: string;
  providerStripeAccountId: string;
  platformFeePercent: number;
  bookings: number;
  createdAt: string;
  description?: string;
  bookingStructure?: BookingStructureType;
  details?: SessionWizardDetails;
  schedule?: SessionSchedule;
  defaultCapacity?: number;
  tickets?: SessionTicket[];
  confirmationEmail?: ConfirmationEmailSettings;
  bookingQuestions?: import("./booking-questions").BookingQuestionConfig[];
  ticketSummaryPrimaryId?: string;
  minSessionCapacity?: number;
  maxSessionCapacity?: number;
  published?: boolean;
  venue?: SessionVenue;
  providerVenueId?: string | null;
  paymentProvider?: import("./payment-providers/types").ActivityPaymentProvider;
  paymentType?: "one_off" | "monthly_subscription" | "free";
  subscriptionEnabled?: boolean;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  billingInterval?: string | null;
  billingStartDate?: string | null;
  billingDay?: number | null;
  trialDays?: number | null;
  cancelAnytime?: boolean;
  minimumCommitmentMonths?: number | null;
};

export type { SessionVenue } from "./session-location";
export {
  buildSessionLocationLabel,
  formatSessionLocation,
  formatSessionVenueAddress,
} from "./session-location";

export const SESSIONS_STORAGE_KEY = "playvera-club-sessions";

import { PLATFORM_FEE_PERCENT, formatMoney } from "./payments";

function normalizeSession(session: ClubSession): ClubSession {
  return {
    ...session,
    createdAt: session.createdAt ?? new Date().toISOString(),
    providerStripeAccountId: session.providerStripeAccountId ?? "",
    platformFeePercent: session.platformFeePercent ?? PLATFORM_FEE_PERCENT,
    description: session.description ?? session.details?.description,
    ageRange: session.ageRange || session.details?.ageGroup || session.ageRange,
  };
}

export function getSessions(): ClubSession[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return (JSON.parse(raw) as ClubSession[]).map(normalizeSession);
  } catch {
    return [];
  }
}

export function getSessionById(id: string): ClubSession | undefined {
  return getSessions().find((session) => session.id === id);
}

export function getActiveSessionDates(session: ClubSession): SessionDateSlot[] {
  if (session.schedule?.dates?.length) {
    return session.schedule.dates.filter((date) => !date.cancelled);
  }

  return [];
}

export function getSessionDateCount(session: ClubSession): number {
  const dates = getActiveSessionDates(session);
  return dates.length > 0 ? dates.length : 1;
}

export function getTicketPriceSummary(session: ClubSession): string {
  if (!session.tickets?.length) {
    return formatCurrency(session.price);
  }

  const summaries = session.tickets.map((ticket) => {
    if (ticket.priceType === "free" || ticket.priceType === "free_trial") {
      return `${ticket.name}: Free`;
    }

    if (ticket.priceType === "term_block") {
      return `${ticket.name}: ${formatMoney(ticket.price)} block`;
    }

    if (ticket.priceType === "subscription") {
      return `${ticket.name}: ${formatMoney(ticket.price)}/month`;
    }

    return `${ticket.name}: ${formatMoney(ticket.price)}/session`;
  });

  return summaries.join(" · ");
}

export function getCapacitySummary(session: ClubSession): string {
  const dates = getActiveSessionDates(session);

  if (dates.length > 0) {
    const capacities = dates.map((date) => date.capacity);
    const min = Math.min(...capacities);
    const max = Math.max(...capacities);

    if (min === max) {
      return `${min} per date`;
    }

    return `${min}–${max} per date`;
  }

  if (
    session.minSessionCapacity &&
    session.maxSessionCapacity &&
    session.minSessionCapacity !== session.maxSessionCapacity
  ) {
    return `${session.minSessionCapacity}–${session.maxSessionCapacity} per date`;
  }

  return `${session.capacity} places`;
}

export function incrementSessionBookings(sessionId: string): void {
  const sessions = getSessions();
  const index = sessions.findIndex((session) => session.id === sessionId);

  if (index === -1) {
    return;
  }

  sessions[index].bookings += 1;
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

export function saveSession(
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
): ClubSession {
  const sessions = getSessions();
  const newSession: ClubSession = {
    ...session,
    id: crypto.randomUUID(),
    bookings: 0,
    createdAt: new Date().toISOString(),
    published: session.published ?? true,
  };

  sessions.push(newSession);
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));

  return newSession;
}

export function clearLocalSessions(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SESSIONS_STORAGE_KEY);
}

export type SessionInput = Omit<
  ClubSession,
  "id" | "bookings" | "createdAt"
>;

export function updateSession(
  id: string,
  updates: SessionInput,
): ClubSession | null {
  const sessions = getSessions();
  const index = sessions.findIndex((session) => session.id === id);

  if (index === -1) {
    return null;
  }

  const updatedSession: ClubSession = {
    ...sessions[index],
    ...updates,
  };

  sessions[index] = updatedSession;
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));

  return updatedSession;
}

export function deleteSession(id: string): boolean {
  const sessions = getSessions();
  const filtered = sessions.filter((session) => session.id !== id);

  if (filtered.length === sessions.length) {
    return false;
  }

  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function formatDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}

export function formatCurrency(amount: number): string {
  return `£${amount.toFixed(0)}`;
}

export { formatMoney };

export const activityLabels: Record<string, string> = {
  sports: "Sports",
  arts: "Arts & Crafts",
  music: "Music",
  camps: "Camps",
  stem: "STEM",
};

export function formatActivityType(type: string): string {
  return activityLabels[type] ?? type;
}

export const ticketPriceTypeLabels: Record<TicketPriceType, string> = {
  free: "Free session",
  term_block: "One-off payment",
  per_session: "One-off payment",
  free_trial: "Free session",
  subscription: "Monthly subscription",
};

export function formatTicketPriceType(type: TicketPriceType): string {
  return ticketPriceTypeLabels[type];
}
