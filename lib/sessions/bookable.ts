import type { ClubSession, SessionSchedule } from "@/lib/sessions";
import { getActiveSessionDates } from "@/lib/sessions";

type ScheduleMeta = SessionSchedule & {
  visibility?: "public" | "hidden" | string;
  admin_status?: "published" | "unpublished" | "draft" | string;
};

export function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getScheduleMeta(session: ClubSession): ScheduleMeta | undefined {
  return session.schedule as ScheduleMeta | undefined;
}

export function isSessionPublished(session: ClubSession): boolean {
  const schedule = getScheduleMeta(session);

  if (schedule?.admin_status === "published") {
    return true;
  }

  if (
    schedule?.admin_status === "unpublished" ||
    schedule?.admin_status === "draft"
  ) {
    return false;
  }

  return session.published === true;
}

export function isSessionPubliclyVisible(session: ClubSession): boolean {
  const schedule = getScheduleMeta(session);

  if (schedule?.visibility === "hidden") {
    return false;
  }

  if (schedule?.visibility === "public") {
    return true;
  }

  return session.published !== false;
}

export function sessionHasCapacity(session: ClubSession): boolean {
  const dates = getActiveSessionDates(session);

  if (dates.some((slot) => slot.capacity > 0)) {
    return true;
  }

  if ((session.capacity ?? 0) > 0) {
    return true;
  }

  if ((session.defaultCapacity ?? 0) > 0) {
    return true;
  }

  if ((session.maxSessionCapacity ?? 0) > 0) {
    return true;
  }

  return false;
}

export function sessionHasFutureDates(
  session: ClubSession,
  today: string = getTodayIsoDate(),
): boolean {
  const dates = getActiveSessionDates(session);

  if (dates.length > 0) {
    return dates.some((slot) => !slot.cancelled && slot.date >= today);
  }

  const schedule = session.schedule;

  if (schedule?.blockEndDate && schedule.blockEndDate >= today) {
    return true;
  }

  if (schedule?.repeatEndDate && schedule.repeatEndDate >= today) {
    return true;
  }

  if (schedule?.blockStartDate && schedule.blockStartDate >= today) {
    return true;
  }

  if (schedule?.repeatStartDate && schedule.repeatStartDate >= today) {
    return true;
  }

  if (
    schedule?.blockStartDate &&
    schedule.blockEndDate &&
    schedule.blockEndDate >= today
  ) {
    return true;
  }

  if (
    schedule?.repeatStartDate &&
    schedule.repeatEndDate &&
    schedule.repeatEndDate >= today
  ) {
    return true;
  }

  return false;
}

export function isBookableSession(session: ClubSession): boolean {
  if (!isSessionPublished(session)) {
    return false;
  }

  if (!isSessionPubliclyVisible(session)) {
    return false;
  }

  if (!sessionHasCapacity(session)) {
    return false;
  }

  if (!sessionHasFutureDates(session)) {
    return false;
  }

  return true;
}

export function filterBookableSessions(sessions: ClubSession[]): ClubSession[] {
  return sessions.filter(isBookableSession);
}
