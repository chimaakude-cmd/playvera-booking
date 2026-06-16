import type { ClubSession } from "@/lib/sessions";
import {
  getDistanceMiles,
  getStoredSessionCoordinates,
  type SessionCoordinates,
} from "@/lib/session-coordinates";
import { sessionMatchesLocationQuery } from "@/lib/session-location";
import { formatActivityType } from "@/lib/sessions";

export type ParentSessionSearchFilters = {
  location: string;
  radius: string;
  childAge: string;
  activity: string;
};

export function filterSessionsForParentPage(
  sessions: ClubSession[],
  filters: ParentSessionSearchFilters,
  searchCenter?: SessionCoordinates | null,
): ClubSession[] {
  const locationQuery = filters.location.trim();
  const hasLocationSearch = locationQuery.length > 0;
  const radiusMiles = Number(filters.radius) || 25;

  const activityQuery = filters.activity.trim().toLowerCase();
  const ageQuery = filters.childAge.trim();

  return sessions.filter((session) => {
    const locationMatch = sessionMatchesLocationQuery(session, locationQuery);

    const activityMatch =
      !activityQuery ||
      session.activityType.toLowerCase().includes(activityQuery) ||
      formatActivityType(session.activityType)
        .toLowerCase()
        .includes(activityQuery) ||
      session.sessionTitle.toLowerCase().includes(activityQuery);

    const ageMatch =
      !ageQuery ||
      session.ageRange.toLowerCase().includes(ageQuery) ||
      session.ageRange.includes(ageQuery);

    let radiusMatch = true;
    if (hasLocationSearch && searchCenter) {
      const coordinates = getStoredSessionCoordinates(session);
      if (coordinates) {
        radiusMatch =
          getDistanceMiles(
            searchCenter.lat,
            searchCenter.lng,
            coordinates.lat,
            coordinates.lng,
          ) <= radiusMiles;
      }
    }

    return locationMatch && activityMatch && ageMatch && radiusMatch;
  });
}

export function getParentSessionsResultsLabel(
  count: number,
  filters: ParentSessionSearchFilters,
): string {
  if (count === 0) {
    return "0 activities found";
  }

  const noun = count === 1 ? "activity" : "activities";
  const locationQuery = filters.location.trim();

  if (!locationQuery) {
    return `${count} ${noun} found`;
  }

  return `${count} ${noun} found within ${filters.radius} miles of ${locationQuery}`;
}
