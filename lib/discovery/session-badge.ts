import { getBookings } from "@/lib/bookings";
import type { ClubSession } from "@/lib/sessions";
import { getActiveSessionDates } from "@/lib/sessions";

export const FILLING_FAST_THRESHOLD = 3;

export type SessionStatusBadgeKind =
  | "sold-out"
  | "few-spaces-left"
  | "limited-availability"
  | "popular"
  | "filling-fast"
  | "space-available"
  | "new-session"
  | "starting-soon";

export type SessionStatusBadge = {
  kind: SessionStatusBadgeKind;
  label: string;
  emoji: string;
  tooltip?: string;
  animate?: boolean;
};

export type SessionBadgeMetrics = {
  maxCapacity: number;
  currentBookings: number;
  bookingPercentage: number;
  remainingSpaces: number;
  newBookingsLast7Days: number;
  createdWithinDays: number;
  daysUntilSessionStart: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseIsoDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export function getSessionMaxCapacity(session: ClubSession): number {
  const dates = getActiveSessionDates(session);
  if (dates.length > 0) {
    const total = dates.reduce((sum, slot) => sum + slot.capacity, 0);
    if (total > 0) {
      return total;
    }
  }

  return (
    session.maxSessionCapacity ??
    session.capacity ??
    session.defaultCapacity ??
    0
  );
}

export function getSessionCurrentBookings(session: ClubSession): number {
  const fromRecords = getBookings().filter(
    (booking) =>
      booking.sessionId === session.id && booking.status !== "cancelled",
  ).length;

  return Math.max(fromRecords, session.bookings ?? 0);
}

function getNewBookingsLast7Days(
  session: ClubSession,
  currentBookings: number,
): number {
  const sevenDaysAgo = Date.now() - 7 * MS_PER_DAY;
  const fromRecords = getBookings().filter(
    (booking) =>
      booking.sessionId === session.id &&
      booking.status !== "cancelled" &&
      new Date(booking.createdAt).getTime() >= sevenDaysAgo,
  ).length;

  if (fromRecords > 0) {
    return fromRecords;
  }

  const hasRecentBookingFlag = session.tickets?.some(
    (ticket) => ticket.recentBookingFlag,
  );
  if (hasRecentBookingFlag && currentBookings >= FILLING_FAST_THRESHOLD) {
    return FILLING_FAST_THRESHOLD;
  }

  return 0;
}

function getCreatedWithinDays(session: ClubSession): number {
  const created = new Date(session.createdAt);
  if (Number.isNaN(created.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - created.getTime()) / MS_PER_DAY);
}

function getDaysUntilSessionStart(session: ClubSession): number | null {
  const today = getTodayAtMidnight();
  const upcomingDates = getActiveSessionDates(session)
    .map((slot) => slot.date)
    .filter(Boolean)
    .map(parseIsoDate)
    .filter((date) => date >= today)
    .sort((left, right) => left.getTime() - right.getTime());

  if (upcomingDates.length > 0) {
    return Math.ceil(
      (upcomingDates[0].getTime() - today.getTime()) / MS_PER_DAY,
    );
  }

  const schedule = session.schedule;
  const fallbackStart =
    schedule?.repeatStartDate ?? schedule?.blockStartDate ?? null;

  if (fallbackStart) {
    const start = parseIsoDate(fallbackStart);
    if (start >= today) {
      return Math.ceil((start.getTime() - today.getTime()) / MS_PER_DAY);
    }
  }

  return null;
}

export function getSessionBadgeMetrics(
  session: ClubSession,
): SessionBadgeMetrics {
  const maxCapacity = getSessionMaxCapacity(session);
  const currentBookings = getSessionCurrentBookings(session);
  const bookingPercentage =
    maxCapacity > 0 ? (currentBookings / maxCapacity) * 100 : 0;
  const remainingSpaces = Math.max(0, maxCapacity - currentBookings);

  return {
    maxCapacity,
    currentBookings,
    bookingPercentage,
    remainingSpaces,
    newBookingsLast7Days: getNewBookingsLast7Days(session, currentBookings),
    createdWithinDays: getCreatedWithinDays(session),
    daysUntilSessionStart: getDaysUntilSessionStart(session),
  };
}

function fewSpacesLabel(remainingSpaces: number): string {
  if (remainingSpaces === 1) {
    return "1 Space Left";
  }
  return `${remainingSpaces} Spaces Left`;
}

export function resolveSessionStatusBadge(
  session: ClubSession,
  metrics: SessionBadgeMetrics = getSessionBadgeMetrics(session),
): SessionStatusBadge | null {
  const {
    maxCapacity,
    currentBookings,
    bookingPercentage,
    remainingSpaces,
    newBookingsLast7Days,
    createdWithinDays,
    daysUntilSessionStart,
  } = metrics;

  if (maxCapacity > 0 && remainingSpaces <= 0) {
    return {
      kind: "sold-out",
      label: "Sold Out",
      emoji: "🔴",
    };
  }

  if (remainingSpaces > 0 && remainingSpaces <= 3) {
    return {
      kind: "few-spaces-left",
      label: fewSpacesLabel(remainingSpaces),
      emoji: "🟠",
    };
  }

  if (
    maxCapacity > 0 &&
    remainingSpaces > 0 &&
    remainingSpaces <= maxCapacity * 0.2
  ) {
    return {
      kind: "limited-availability",
      label: "Limited Spaces",
      emoji: "🟠",
    };
  }

  if (bookingPercentage >= 60) {
    return {
      kind: "popular",
      label: "Popular",
      emoji: "🔥",
      tooltip: "More than 60% booked",
      animate: true,
    };
  }

  if (newBookingsLast7Days >= FILLING_FAST_THRESHOLD) {
    return {
      kind: "filling-fast",
      label: "Filling Fast",
      emoji: "⚡",
      tooltip: "Recent bookings increasing",
      animate: true,
    };
  }

  if (currentBookings === 0) {
    return {
      kind: "space-available",
      label: "Spaces Available",
      emoji: "🟢",
      tooltip: "Be the first to book",
    };
  }

  if (createdWithinDays <= 14) {
    return {
      kind: "new-session",
      label: "New Session",
      emoji: "🆕",
      tooltip: "Recently added",
    };
  }

  if (daysUntilSessionStart !== null && daysUntilSessionStart <= 7) {
    return {
      kind: "starting-soon",
      label: "Starting Soon",
      emoji: "⏰",
    };
  }

  return null;
}

export function isSessionSoldOut(session: ClubSession): boolean {
  const metrics = getSessionBadgeMetrics(session);
  return metrics.maxCapacity > 0 && metrics.remainingSpaces <= 0;
}
