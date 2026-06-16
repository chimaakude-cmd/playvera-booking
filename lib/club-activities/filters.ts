import {
  isActivityLiveNow,
  isActivityPast,
  isActivityUpcoming,
} from "./map-session";
import type {
  ActivityFilterOptions,
  ActivityFilters,
  ActivityRow,
  ActivityViewTab,
} from "./types";

function matchesQuery(row: ActivityRow, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    row.title.toLowerCase().includes(normalized) ||
    row.venueName.toLowerCase().includes(normalized) ||
    row.ageRange.toLowerCase().includes(normalized) ||
    row.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
    row.category.toLowerCase().includes(normalized)
  );
}

function matchesViewTab(row: ActivityRow, viewTab: ActivityViewTab): boolean {
  switch (viewTab) {
    case "all":
      return row.status !== "archived";
    case "upcoming":
      return isActivityUpcoming(row) && row.status !== "archived";
    case "live_now":
      return isActivityLiveNow(row);
    case "past":
      return isActivityPast(row);
    case "draft":
      return row.status === "draft";
    default:
      return true;
  }
}

function matchesDayOfWeek(row: ActivityRow, dayOfWeek: string): boolean {
  if (dayOfWeek === "all") {
    return true;
  }

  const dayLabels: Record<string, string> = {
    monday: "Mo",
    tuesday: "Tu",
    wednesday: "We",
    thursday: "Th",
    friday: "Fr",
    saturday: "Sa",
    sunday: "Su",
  };

  const chip = dayLabels[dayOfWeek.toLowerCase()];
  return chip ? row.daysOfWeek.includes(chip) : true;
}

export function filterActivityRows(
  rows: ActivityRow[],
  viewTab: ActivityViewTab,
  filters: ActivityFilters,
): ActivityRow[] {
  return rows
    .filter((row) => matchesViewTab(row, viewTab))
    .filter((row) => matchesQuery(row, filters.query))
    .filter((row) =>
      filters.activityType === "all"
        ? true
        : row.activityType === filters.activityType,
    )
    .filter((row) =>
      filters.venue === "all" ? true : row.venueName === filters.venue,
    )
    .filter((row) =>
      filters.ageGroup === "all" ? true : row.ageRange === filters.ageGroup,
    )
    .filter((row) =>
      filters.category === "all" ? true : row.category === filters.category,
    )
    .filter((row) => {
      if (filters.visibility === "all") return true;
      if (filters.visibility === "published") return row.visibility;
      return !row.visibility;
    })
    .filter((row) => matchesDayOfWeek(row, filters.dayOfWeek))
    .sort((left, right) => {
      if (left.status === "archived" && right.status !== "archived") {
        return 1;
      }
      if (right.status === "archived" && left.status !== "archived") {
        return -1;
      }

      return left.title.localeCompare(right.title);
    });
}

export function extractFilterOptions(rows: ActivityRow[]): ActivityFilterOptions {
  const activityTypes = new Set<string>();
  const venues = new Set<string>();
  const ageGroups = new Set<string>();
  const categories = new Set<string>();

  for (const row of rows) {
    if (row.activityType) activityTypes.add(row.activityType);
    if (row.venueName) venues.add(row.venueName);
    if (row.ageRange) ageGroups.add(row.ageRange);
    if (row.category) categories.add(row.category);
  }

  return {
    activityTypes: Array.from(activityTypes).sort(),
    venues: Array.from(venues).sort(),
    ageGroups: Array.from(ageGroups).sort(),
    categories: Array.from(categories).sort(),
  };
}

export function filterActivities(
  rows: ActivityRow[],
  viewTab: ActivityViewTab,
  filters: ActivityFilters,
): ActivityRow[] {
  return filterActivityRows(rows, viewTab, filters);
}
