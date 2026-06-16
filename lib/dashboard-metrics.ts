import { Booking } from "./bookings";
import {
  ClubSession,
  formatSessionLocation,
  getActiveSessionDates,
} from "./sessions";

const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type GrowthMetric = {
  value: number;
  direction: "up" | "down" | "flat";
  label: string;
};

export type DashboardKpi = {
  label: string;
  value: string;
  hint: string;
  growth?: GrowthMetric;
  accent: "teal" | "violet" | "amber" | "slate" | "rose";
};

export type CapacityAlert = {
  sessionId: string;
  sessionTitle: string;
  venue: string;
  filled: number;
  capacity: number;
  fillPercent: number;
  severity: "warning" | "full";
};

export type ActivityPerformanceRow = {
  sessionId: string;
  activity: string;
  venue: string;
  bookings: number;
  capacity: number;
  fillPercent: number;
  revenue: number;
};

export type ChartPoint = {
  label: string;
  value: number;
};

function getTodayWeekday(): string {
  return WEEKDAY_NAMES[new Date().getDay()];
}

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameCalendarMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function getPreviousMonth(reference: Date): Date {
  return new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
}

function getConfirmedBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((booking) => booking.status === "confirmed");
}

function getSessionCapacity(session: ClubSession): number {
  const dates = getActiveSessionDates(session);
  if (dates.length > 0) {
    return dates.reduce((total, date) => total + date.capacity, 0);
  }

  return session.capacity;
}

function getSessionFilled(session: ClubSession, bookings: Booking[]): number {
  return bookings.filter(
    (booking) =>
      booking.sessionId === session.id && booking.status !== "cancelled",
  ).length;
}

function getSessionRevenue(sessionId: string, bookings: Booking[]): number {
  return getConfirmedBookings(bookings)
    .filter((booking) => booking.sessionId === sessionId)
    .reduce((total, booking) => total + booking.pricePaid, 0);
}

export function sessionRunsToday(session: ClubSession): boolean {
  const todayIso = getTodayIsoDate();
  const todayWeekday = getTodayWeekday();
  const scheduledToday = getActiveSessionDates(session).some(
    (slot) => slot.date === todayIso,
  );

  return scheduledToday || session.day?.toLowerCase() === todayWeekday;
}

export function getTodaysSessions(sessions: ClubSession[]): ClubSession[] {
  return sessions
    .filter(sessionRunsToday)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

export function getUpcomingSessionsCount(sessions: ClubSession[]): number {
  const todayIso = getTodayIsoDate();
  const upcomingDates = sessions.flatMap((session) =>
    getActiveSessionDates(session).filter((slot) => slot.date >= todayIso),
  );

  if (upcomingDates.length > 0) {
    return upcomingDates.length;
  }

  return sessions.length;
}

export function getAttendancePercentage(
  sessions: ClubSession[],
  bookings: Booking[],
): number {
  const totalCapacity = sessions.reduce(
    (total, session) => total + getSessionCapacity(session),
    0,
  );

  if (totalCapacity === 0) {
    return 0;
  }

  const activeBookings = bookings.filter(
    (booking) => booking.status !== "cancelled",
  ).length;

  return Math.min(100, Math.round((activeBookings / totalCapacity) * 100));
}

export function getRevenueForMonth(
  bookings: Booking[],
  reference = new Date(),
): number {
  return getConfirmedBookings(bookings)
    .filter((booking) => isSameCalendarMonth(new Date(booking.createdAt), reference))
    .reduce((total, booking) => total + booking.pricePaid, 0);
}

export function getBookingsForMonth(
  bookings: Booking[],
  reference = new Date(),
): number {
  return bookings.filter((booking) =>
    isSameCalendarMonth(new Date(booking.createdAt), reference),
  ).length;
}

export function getGrowthVsPreviousMonth(
  bookings: Booking[],
): GrowthMetric {
  const now = new Date();
  const previousMonth = getPreviousMonth(now);
  const currentRevenue = getRevenueForMonth(bookings, now);
  const previousRevenue = getRevenueForMonth(bookings, previousMonth);

  if (previousRevenue === 0) {
    return {
      value: currentRevenue > 0 ? 100 : 0,
      direction: currentRevenue > 0 ? "up" : "flat",
      label: "vs last month",
    };
  }

  const change = Math.round(
    ((currentRevenue - previousRevenue) / previousRevenue) * 100,
  );

  return {
    value: Math.abs(change),
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    label: "vs last month",
  };
}

export function getCapacityAlerts(
  sessions: ClubSession[],
  bookings: Booking[],
): CapacityAlert[] {
  return sessions
    .map((session) => {
      const capacity = getSessionCapacity(session);
      const filled = getSessionFilled(session, bookings);
      const fillPercent =
        capacity > 0 ? Math.round((filled / capacity) * 100) : 0;

      return {
        sessionId: session.id,
        sessionTitle: session.sessionTitle,
        venue: formatSessionLocation(session),
        filled,
        capacity,
        fillPercent,
        severity: (fillPercent >= 100 ? "full" : "warning") as CapacityAlert["severity"],
      };
    })
    .filter((alert) => alert.fillPercent >= 80)
    .sort((left, right) => right.fillPercent - left.fillPercent);
}

export function getMonthlyRevenueTrend(
  bookings: Booking[],
): ChartPoint[] {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = monthDate.toLocaleDateString("en-GB", { month: "short" });
    const value = getRevenueForMonth(bookings, monthDate);

    return { label, value };
  });
}

export function getWeeklyBookingTrend(bookings: Booking[]): ChartPoint[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return days.map((label, index) => {
    const value = bookings.filter((booking) => {
      if (booking.status === "cancelled") {
        return false;
      }

      return new Date(booking.createdAt).getDay() === index;
    }).length;

    return { label, value };
  });
}

export function getActivityPerformance(
  sessions: ClubSession[],
  bookings: Booking[],
): ActivityPerformanceRow[] {
  return sessions
    .map((session) => {
      const capacity = getSessionCapacity(session);
      const bookingsCount = getSessionFilled(session, bookings);

      return {
        sessionId: session.id,
        activity: session.sessionTitle,
        venue: formatSessionLocation(session),
        bookings: bookingsCount,
        capacity,
        fillPercent:
          capacity > 0 ? Math.round((bookingsCount / capacity) * 100) : 0,
        revenue: getSessionRevenue(session.id, bookings),
      };
    })
    .sort((left, right) => right.revenue - left.revenue || right.bookings - left.bookings)
    .slice(0, 5);
}

export function buildDashboardKpis(
  sessions: ClubSession[],
  bookings: Booking[],
  formatCurrency: (amount: number) => string,
): DashboardKpi[] {
  const growth = getGrowthVsPreviousMonth(bookings);

  return [
    {
      label: "Total bookings",
      value: String(bookings.filter((booking) => booking.status !== "cancelled").length),
      hint: "Active bookings across all activities",
      growth,
      accent: "teal",
    },
    {
      label: "Revenue this month",
      value: formatCurrency(getRevenueForMonth(bookings)),
      hint: "Confirmed payments received",
      growth,
      accent: "violet",
    },
    {
      label: "Attendance",
      value: `${getAttendancePercentage(sessions, bookings)}%`,
      hint: "Capacity filled across sessions",
      accent: "amber",
    },
    {
      label: "Upcoming sessions",
      value: String(getUpcomingSessionsCount(sessions)),
      hint: "Scheduled dates ahead",
      accent: "slate",
    },
    {
      label: "Growth",
      value:
        growth.direction === "flat"
          ? "0%"
          : `${growth.direction === "up" ? "+" : "-"}${growth.value}%`,
      hint: growth.label,
      accent: "rose",
    },
  ];
}
