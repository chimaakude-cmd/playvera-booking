import { getBookingById } from "@/lib/bookings";
import { getClubProfile } from "@/lib/club-profile";
import { getSessionById } from "@/lib/sessions";
import { DEFAULT_CLUB_REVIEW_SETTINGS } from "./defaults";
import type { ClubReviewSettings } from "./types";

export const CLUB_REVIEW_SETTINGS_KEY = "activora-club-review-settings";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getClubReviewSettings(): ClubReviewSettings {
  if (!isBrowser()) {
    return { ...DEFAULT_CLUB_REVIEW_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(CLUB_REVIEW_SETTINGS_KEY);
    if (!raw) {
      const initial = { ...DEFAULT_CLUB_REVIEW_SETTINGS };
      localStorage.setItem(CLUB_REVIEW_SETTINGS_KEY, JSON.stringify(initial));
      return initial;
    }
    return {
      ...DEFAULT_CLUB_REVIEW_SETTINGS,
      ...(JSON.parse(raw) as ClubReviewSettings),
    };
  } catch {
    return { ...DEFAULT_CLUB_REVIEW_SETTINGS };
  }
}

export function saveClubReviewSettings(settings: ClubReviewSettings): void {
  if (!isBrowser()) return;
  localStorage.setItem(CLUB_REVIEW_SETTINGS_KEY, JSON.stringify(settings));
}

export const INCENTIVE_OPTIONS: Array<{
  value: ClubReviewSettings["incentiveType"];
  label: string;
}> = [
  { value: "thank_you_email", label: "Thank-you email" },
  { value: "priority_booking", label: "Priority booking" },
  { value: "club_points", label: "Club points" },
  { value: "discount", label: "Discount (optional)" },
  { value: "none", label: "None" },
];

export const REQUEST_DELAY_OPTIONS: Array<{
  value: ClubReviewSettings["requestDelay"];
  label: string;
}> = [
  { value: "same_day", label: "Same day" },
  { value: "next_day", label: "Next day" },
  { value: "end_of_block", label: "End of block" },
];

export const REMINDER_OPTIONS: Array<{
  value: ClubReviewSettings["reminderDays"];
  label: string;
}> = [
  { value: null, label: "No reminder" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
];

export function getIncentiveLabel(type: ClubReviewSettings["incentiveType"]): string {
  return INCENTIVE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function getReviewLinkForBooking(bookingId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/parent/reviews/${bookingId}`;
  }
  return `/parent/reviews/${bookingId}`;
}

export function getProviderNameForBooking(bookingId: string): string {
  const booking = getBookingById(bookingId);
  if (booking?.providerName) return booking.providerName;
  const profile = getClubProfile();
  return profile?.clubName ?? "Activora Club";
}

export function getSessionTitleForBooking(bookingId: string): string {
  const booking = getBookingById(bookingId);
  if (!booking) return "Session";
  const session = getSessionById(booking.sessionId);
  return session?.sessionTitle ?? booking.sessionTitle ?? "Session";
}

export function getVenueNameForBooking(bookingId: string): string | undefined {
  const booking = getBookingById(bookingId);
  if (!booking) return undefined;
  const session = getSessionById(booking.sessionId);
  return session?.venue?.venueName;
}

export function getDateAttendedForBooking(bookingId: string): string {
  const booking = getBookingById(bookingId);
  if (!booking?.day) return new Date().toISOString().slice(0, 10);
  return booking.day.slice(0, 10);
}
