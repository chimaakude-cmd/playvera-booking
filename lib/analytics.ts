import { Booking } from "./bookings";
import { ClubSession } from "./sessions";

export function getSessionsThisWeek(sessions: ClubSession[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return sessions.filter((session) => {
    const created = session.createdAt
      ? new Date(session.createdAt)
      : new Date(0);
    return created >= startOfWeek;
  }).length;
}

export function getOccupancyPercentage(
  sessions: ClubSession[],
  bookings: Booking[],
): number {
  const totalCapacity = sessions.reduce(
    (total, session) => total + session.capacity,
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

export function getConfirmedRevenue(
  _sessions: ClubSession[],
  bookings: Booking[],
): number {
  return bookings
    .filter((booking) => booking.status === "confirmed")
    .reduce((total, booking) => total + booking.pricePaid, 0);
}

export function getWeeklyRevenueData(
  sessions: ClubSession[],
  bookings: Booking[],
): { label: string; value: number }[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return days.map((label, index) => {
    const value = bookings
      .filter((booking) => {
        if (booking.status !== "confirmed") {
          return false;
        }

        const created = new Date(booking.createdAt);
        return created.getDay() === index;
      })
      .reduce((total, booking) => total + booking.pricePaid, 0);

    return { label, value };
  });
}
