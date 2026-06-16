import { getBookings, type Booking } from "@/lib/bookings";
import { calculateAge, getChildren, type ChildProfile } from "@/lib/children";
import { getSessions, type ClubSession } from "@/lib/sessions";

export type BirthdayScheduleItem = {
  childId: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  birthdayDate: string;
  ageTurning: number;
  activityName: string;
  blockStart: string;
  blockEnd: string;
  bookingId: string;
};

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function birthdayInYear(dob: string, year: number): string {
  const birth = parseDateOnly(dob);
  const month = birth.getMonth();
  const day = birth.getDate();
  const candidate = new Date(year, month, day);
  return formatDateOnly(candidate);
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function getSessionBlockRange(session: ClubSession): { start: string; end: string } | null {
  if (session.schedule?.blockStartDate && session.schedule?.blockEndDate) {
    return {
      start: session.schedule.blockStartDate,
      end: session.schedule.blockEndDate,
    };
  }

  const dates = session.schedule?.dates ?? [];
  if (dates.length === 0) {
    return null;
  }

  const activeDates = dates
    .filter((slot) => !slot.cancelled)
    .map((slot) => slot.date)
    .sort();

  if (activeDates.length === 0) {
    return null;
  }

  return {
    start: activeDates[0],
    end: activeDates[activeDates.length - 1],
  };
}

function findChildForBooking(
  booking: Booking,
  children: ChildProfile[],
): ChildProfile | null {
  if (booking.childId) {
    const byId = children.find((child) => child.id === booking.childId);
    if (byId) return byId;
  }

  const normalizedName = booking.childName.trim().toLowerCase();
  return (
    children.find(
      (child) => child.fullName.trim().toLowerCase() === normalizedName,
    ) ?? null
  );
}

export function getBirthdayMessagesDue(
  birthdayTemplateEnabled = true,
): BirthdayScheduleItem[] {
  if (!birthdayTemplateEnabled) {
    return [];
  }

  const children = getChildren();
  const bookings = getBookings().filter(
    (booking) => booking.status === "confirmed" || booking.status === "pending",
  );
  const sessions = getSessions();
  const currentYear = new Date().getFullYear();
  const items: BirthdayScheduleItem[] = [];

  for (const booking of bookings) {
    const session = sessions.find((entry) => entry.id === booking.sessionId);
    if (!session) continue;

    const block = getSessionBlockRange(session);
    if (!block) continue;

    const child = findChildForBooking(booking, children);
    if (!child?.dateOfBirth) continue;

    const birthdayThisYear = birthdayInYear(child.dateOfBirth, currentYear);
    if (!isDateInRange(birthdayThisYear, block.start, block.end)) {
      continue;
    }

    items.push({
      childId: child.id,
      childName: child.fullName,
      parentName: booking.parentName,
      parentEmail: booking.email,
      birthdayDate: birthdayThisYear,
      ageTurning: calculateAge(child.dateOfBirth) + (
        birthdayThisYear >= formatDateOnly(new Date()) ? 0 : 1
      ),
      activityName: booking.sessionTitle,
      blockStart: block.start,
      blockEnd: block.end,
      bookingId: booking.id,
    });
  }

  return items;
}

export function countBirthdayMessagesDue(
  birthdayTemplateEnabled = true,
): number {
  return getBirthdayMessagesDue(birthdayTemplateEnabled).length;
}
