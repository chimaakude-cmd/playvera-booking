import {
  ACTIVITY_STATUS_LABELS,
  mapSessionToActivityRow,
  type ActivityRow,
  type ActivityStatus,
} from "@/lib/club-activities";
import { getActivityPublicUrl } from "@/lib/club-share/url";
import { shouldShowClubDemoData } from "@/lib/club-demo-mode";
import { getActiveSessionDates, type ClubSession } from "@/lib/sessions";
import {
  DEMO_BLOCK_IMAGE_SRC,
  DEMO_BLOCK_SESSION_ID,
  DEMO_BLOCK_SESSION_OPTION,
  DEMO_REGISTER_CHILD_COUNT,
} from "./seed";

export type RegisterActivityCardData = {
  id: string;
  title: string;
  imageId: string | null;
  imageSrc?: string | null;
  ageRange: string;
  startDate: string | null;
  endDate: string | null;
  timeRange: string;
  venueName: string;
  occupancy: {
    filled: number;
    capacity: number;
    percent: number;
  };
  status: ActivityStatus;
  statusLabel: string;
  upcomingSessionDate: string | null;
  isExample: boolean;
};

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getUpcomingSessionDate(session: ClubSession): string | null {
  const dates = getActiveSessionDates(session)
    .map((slot) => slot.date)
    .filter(Boolean)
    .sort();

  if (dates.length === 0) {
    return null;
  }

  const today = getTodayIsoDate();
  return dates.find((date) => date >= today) ?? dates[dates.length - 1];
}

export function mapActivityRowToRegisterCard(
  row: ActivityRow,
): RegisterActivityCardData {
  return {
    id: row.id,
    title: row.title,
    imageId: row.imageId,
    ageRange: row.ageRange,
    startDate: row.startDate,
    endDate: row.endDate,
    timeRange: row.timeRange,
    venueName: row.venueName,
    occupancy: row.occupancy,
    status: row.status,
    statusLabel: ACTIVITY_STATUS_LABELS[row.status],
    upcomingSessionDate: getUpcomingSessionDate(row.session),
    isExample: false,
  };
}

export function buildRegisterActivityCards(
  sessions: ClubSession[],
): RegisterActivityCardData[] {
  const published = sessions.filter((session) => session.published !== false);
  const cards = published.map((session) =>
    mapActivityRowToRegisterCard(mapSessionToActivityRow(session)),
  );

  if (shouldShowClubDemoData()) {
    cards.push(buildExampleRegisterActivityCard());
  }

  return cards;
}

export function buildExampleRegisterActivityCard(): RegisterActivityCardData {
  const option = DEMO_BLOCK_SESSION_OPTION;
  const capacity = option.capacity ?? 16;
  const filled = DEMO_REGISTER_CHILD_COUNT;

  return {
    id: DEMO_BLOCK_SESSION_ID,
    title: "Summer Skills Block",
    imageId: null,
    imageSrc: DEMO_BLOCK_IMAGE_SRC,
    ageRange: "8–12 years",
    startDate: "2026-06-18",
    endDate: "2026-07-09",
    timeRange: "16:00–17:30",
    venueName: option.venue,
    occupancy: {
      filled,
      capacity,
      percent: Math.round((filled / capacity) * 100),
    },
    status: "published",
    statusLabel: "Example activity",
    upcomingSessionDate: "2026-06-18",
    isExample: true,
  };
}

export function getActivityBookingUrl(
  activityId: string,
  baseUrl?: string,
): string {
  if (activityId === DEMO_BLOCK_SESSION_ID) {
    return "";
  }
  return getActivityPublicUrl(activityId, { baseUrl });
}
