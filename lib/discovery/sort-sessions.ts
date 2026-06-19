import type { ClubSession } from "@/lib/sessions";
import {
  getSessionDistanceMiles,
  type SessionCoordinates,
} from "@/lib/session-coordinates";
import type { ParentSessionSearchFilters } from "@/lib/session-search";
import type { SortOption } from "./constants";
import {
  getCustomerPriceForSession,
  getSessionRating,
} from "./session-display";

export function sortSessions(
  sessions: ClubSession[],
  sort: SortOption,
  filters: ParentSessionSearchFilters,
  searchCenter: SessionCoordinates | null,
): ClubSession[] {
  const sorted = [...sessions];

  switch (sort) {
    case "nearest":
      sorted.sort((a, b) => {
        const distA =
          getSessionDistanceMiles(a, filters.location, searchCenter) ?? 999;
        const distB =
          getSessionDistanceMiles(b, filters.location, searchCenter) ?? 999;
        return distA - distB;
      });
      break;
    case "rating":
      sorted.sort(
        (a, b) => getSessionRating(b) - getSessionRating(a),
      );
      break;
    case "price":
      sorted.sort(
        (a, b) =>
          getCustomerPriceForSession(a) - getCustomerPriceForSession(b),
      );
      break;
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "popular":
      sorted.sort((a, b) => b.bookings - a.bookings);
      break;
    default:
      break;
  }

  return sorted;
}
