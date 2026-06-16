import type { Booking } from "@/lib/bookings";
import { getBookings } from "@/lib/bookings";
import {
  getActiveSessionDates,
  type ClubSession,
} from "@/lib/sessions";
import type { ActivityMetrics, ActivityRow } from "./types";
import { isActivityArchived } from "./storage";

function isSameCalendarMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUpcomingSessionCount(sessions: ClubSession[]): number {
  const today = getTodayIsoDate();
  const upcomingDates = sessions.flatMap((session) =>
    getActiveSessionDates(session).filter((slot) => slot.date >= today),
  );

  if (upcomingDates.length > 0) {
    return upcomingDates.length;
  }

  return sessions.filter((session) => session.published !== false).length;
}

export function computeActivityMetrics(
  rows: ActivityRow[],
  bookings: Booking[] = getBookings(),
): ActivityMetrics {
  const activeRows = rows.filter(
    (row) =>
      !isActivityArchived(row.id) &&
      row.status !== "archived" &&
      row.status !== "cancelled",
  );

  const activeActivities = activeRows.filter(
    (row) => row.status === "published" || row.status === "full",
  ).length;

  const upcomingSessions = getUpcomingSessionCount(
    activeRows.map((row) => row.session),
  );

  const placesBooked = activeRows.reduce(
    (sum, row) => sum + row.occupancy.filled,
    0,
  );

  const totalCapacity = activeRows.reduce(
    (sum, row) => sum + row.occupancy.capacity,
    0,
  );

  const occupancyPercent =
    totalCapacity > 0
      ? Math.round((placesBooked / totalCapacity) * 100)
      : 0;

  const now = new Date();
  const revenueThisMonth = bookings
    .filter(
      (booking) =>
        booking.status === "confirmed" &&
        isSameCalendarMonth(new Date(booking.createdAt), now),
    )
    .reduce((sum, booking) => sum + booking.pricePaid, 0);

  return {
    activeActivities,
    upcomingSessions,
    placesBooked,
    occupancyPercent,
    revenueThisMonth,
  };
}

export function getOccupancyTone(
  percent: number,
): "green" | "amber" | "red" {
  if (percent >= 80) return "green";
  if (percent >= 50) return "amber";
  return "red";
}
