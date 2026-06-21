import { getBookings } from "@/lib/bookings";
import {
  ACTIVITY_PAYMENT_PROVIDER_BADGES,
} from "@/lib/payment-providers/types";
import { resolveSessionPaymentProvider } from "@/lib/payment-providers/availability";
import { getActivityRatingSummary } from "@/lib/reviews/ratings";
import { getReviews } from "@/lib/reviews/storage";
import { formatSessionLocation, getActiveSessionDates } from "@/lib/sessions";
import { formatActivityType } from "@/lib/sessions";
import { getSessionImages } from "@/lib/session-images";
import {
  getActivityVisibilityOverrides,
  isActivityArchived,
} from "./storage";
import type {
  ActivityOccupancy,
  ActivityReviews,
  ActivityRow,
  ActivityStatus,
  ActivityWarning,
} from "./types";
import { DAY_CHIP_LABELS } from "./types";
import type { ClubSession } from "@/lib/sessions";
import type { Booking } from "@/lib/bookings";

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSessionCapacity(session: ClubSession): number {
  const dates = getActiveSessionDates(session);
  if (dates.length > 0) {
    return dates.reduce((total, slot) => total + slot.capacity, 0);
  }

  return session.capacity || session.maxSessionCapacity || 0;
}

function getSessionFilled(session: ClubSession, bookings: Booking[]): number {
  const fromBookings = bookings.filter(
    (booking) =>
      booking.sessionId === session.id && booking.status !== "cancelled",
  ).length;

  return Math.max(fromBookings, session.bookings ?? 0);
}

function computeOccupancy(
  session: ClubSession,
  bookings: Booking[],
): ActivityOccupancy {
  const capacity = getSessionCapacity(session);
  const filled = getSessionFilled(session, bookings);
  const percent =
    capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;

  return { filled, capacity, percent };
}

function extractDateRange(session: ClubSession): {
  startDate: string | null;
  endDate: string | null;
} {
  const dates = getActiveSessionDates(session)
    .map((slot) => slot.date)
    .filter(Boolean)
    .sort();

  if (dates.length > 0) {
    return { startDate: dates[0], endDate: dates[dates.length - 1] };
  }

  const schedule = session.schedule;
  if (schedule?.repeatStartDate) {
    return {
      startDate: schedule.repeatStartDate,
      endDate: schedule.repeatEndDate || schedule.repeatStartDate,
    };
  }

  if (schedule?.blockStartDate) {
    return {
      startDate: schedule.blockStartDate,
      endDate: schedule.blockEndDate || schedule.blockStartDate,
    };
  }

  return { startDate: null, endDate: null };
}

function extractDaysOfWeek(session: ClubSession): string[] {
  const days = new Set<string>();

  if (session.day) {
    days.add(session.day.toLowerCase());
  }

  if (session.schedule?.repeatDayOfWeek) {
    days.add(session.schedule.repeatDayOfWeek.toLowerCase());
  }

  if (session.schedule?.blockDayOfWeek) {
    days.add(session.schedule.blockDayOfWeek.toLowerCase());
  }

  for (const slot of getActiveSessionDates(session)) {
    if (!slot.date) continue;
    const weekday = new Date(`${slot.date}T12:00:00`)
      .toLocaleDateString("en-GB", { weekday: "long" })
      .toLowerCase();
    days.add(weekday);
  }

  const order = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return order
    .filter((day) => days.has(day))
    .map((day) => DAY_CHIP_LABELS[day] ?? day.slice(0, 2));
}

function buildTags(session: ClubSession): string[] {
  const tags: string[] = [];

  if (session.activityType) {
    tags.push(formatActivityType(session.activityType));
  }

  if (session.bookingStructure === "block") {
    tags.push("Block booking");
  } else if (session.bookingStructure === "subscription") {
    tags.push("Subscription");
  }

  if (session.tickets?.some((ticket) => ticket.priceType === "free_trial")) {
    tags.push("Free trial");
  }

  const paymentProvider = resolveSessionPaymentProvider(session);
  if (paymentProvider) {
    tags.push(ACTIVITY_PAYMENT_PROVIDER_BADGES[paymentProvider]);
  }

  return tags.slice(0, 4);
}

function resolveReviews(sessionId: string): ActivityReviews {
  const summary = getActivityRatingSummary(sessionId, getReviews());

  return {
    rating: summary.averageRating,
    count: summary.reviewCount,
  };
}

function resolveStatus(
  session: ClubSession,
  occupancy: ActivityOccupancy,
  visibility: boolean,
): ActivityStatus {
  if (isActivityArchived(session.id)) {
    return "archived";
  }

  const dates = getActiveSessionDates(session);
  if (
    dates.length > 0 &&
    dates.every((slot) => slot.cancelled)
  ) {
    return "cancelled";
  }

  if (session.published === false || !visibility) {
    return "draft";
  }

  if (occupancy.capacity > 0 && occupancy.filled >= occupancy.capacity) {
    return "full";
  }

  return "published";
}

function resolveWarnings(
  session: ClubSession,
  occupancy: ActivityOccupancy,
  status: ActivityStatus,
): ActivityWarning[] {
  const warnings: ActivityWarning[] = [];

  if (status === "published" || status === "full") {
    if (occupancy.percent < 50 && occupancy.capacity > 0) {
      warnings.push("low_bookings");
    }

    if (occupancy.percent >= 80 && occupancy.percent < 100) {
      warnings.push("nearly_full");
    }
  }

  const recentBookings = getBookings().filter(
    (booking) =>
      booking.sessionId === session.id &&
      booking.status === "confirmed" &&
      Date.now() - new Date(booking.createdAt).getTime() <
        7 * 24 * 60 * 60 * 1000,
  ).length;

  if (recentBookings >= 3 || (session.bookings ?? 0) >= 8) {
    warnings.push("trending");
  }

  return warnings;
}

function resolveTimeRange(session: ClubSession): string {
  const dates = getActiveSessionDates(session);
  if (dates.length > 0) {
    const slot = dates[0];
    return `${slot.startTime}–${slot.endTime}`;
  }

  return `${session.startTime}–${session.endTime}`;
}

export function mapSessionToActivityRow(session: ClubSession): ActivityRow {
  const bookings = getBookings();
  const visibilityOverrides = getActivityVisibilityOverrides();
  const defaultVisible = session.published !== false;
  const visibility =
    visibilityOverrides[session.id] ?? defaultVisible;
  const occupancy = computeOccupancy(session, bookings);
  const status = resolveStatus(session, occupancy, visibility);
  const { startDate, endDate } = extractDateRange(session);
  const { mainImageId } = getSessionImages(session);
  const venue = session.venue ?? null;

  return {
    id: session.id,
    session,
    title: session.sessionTitle,
    imageId: mainImageId,
    ageRange:
      session.ageRange ||
      session.details?.ageGroup ||
      "All ages",
    tags: buildTags(session),
    startDate,
    endDate,
    daysOfWeek: extractDaysOfWeek(session),
    occupancy,
    timeRange: resolveTimeRange(session),
    status,
    venueName: venue?.venueName || formatSessionLocation(session),
    venue,
    reviews: resolveReviews(session.id),
    visibility,
    warnings: resolveWarnings(session, occupancy, status),
    activityType: session.activityType || "other",
    category: formatActivityType(session.activityType || "other"),
  };
}

export function mapSessionsToActivityRows(
  sessions: ClubSession[],
): ActivityRow[] {
  return sessions.map(mapSessionToActivityRow);
}

export function isActivityUpcoming(row: ActivityRow): boolean {
  const today = getTodayIsoDate();
  if (row.startDate && row.startDate >= today) {
    return true;
  }

  if (row.endDate && row.endDate >= today) {
    return true;
  }

  return row.status === "published" || row.status === "draft";
}

export function isActivityPast(row: ActivityRow): boolean {
  const today = getTodayIsoDate();
  if (row.endDate) {
    return row.endDate < today;
  }

  if (row.startDate) {
    return row.startDate < today;
  }

  return false;
}

export function isActivityLiveNow(row: ActivityRow): boolean {
  const today = getTodayIsoDate();
  const dates = getActiveSessionDates(row.session);
  const runsToday =
    dates.some((slot) => slot.date === today) ||
    row.session.day?.toLowerCase() ===
      new Date().toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();

  if (!runsToday) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = row.session.startTime.split(":").map(Number);
  const [endHour, endMin] = row.session.endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}
