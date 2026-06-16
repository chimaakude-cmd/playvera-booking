import type { HomeSearchFilters } from "@/lib/home/search-url";
import type { ParentSessionSearchFilters } from "@/lib/session-search";

export function toParentFilters(
  filters: HomeSearchFilters,
): ParentSessionSearchFilters {
  return {
    location: filters.location,
    radius: filters.radius,
    childAge: filters.childAge,
    activity: filters.activity,
  };
}
