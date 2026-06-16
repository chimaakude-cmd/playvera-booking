import type { ActivityFilters, SavedFilterView } from "./types";
import { DEFAULT_ACTIVITY_FILTERS } from "./types";

export const ACTIVITIES_VISIBILITY_KEY = "activora-activities-visibility";
export const ACTIVITIES_ARCHIVED_KEY = "activora-activities-archived";
export const ACTIVITIES_FILTER_VIEW_KEY = "activora-activities-filter-view";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function getActivityVisibilityOverrides(): Record<string, boolean> {
  return readJson<Record<string, boolean>>(ACTIVITIES_VISIBILITY_KEY, {});
}

export function setActivityVisibility(
  activityId: string,
  visible: boolean,
): void {
  const overrides = getActivityVisibilityOverrides();
  overrides[activityId] = visible;
  writeJson(ACTIVITIES_VISIBILITY_KEY, overrides);
}

export function getArchivedActivityIds(): string[] {
  return readJson<string[]>(ACTIVITIES_ARCHIVED_KEY, []);
}

export function isActivityArchived(activityId: string): boolean {
  return getArchivedActivityIds().includes(activityId);
}

export function archiveActivities(activityIds: string[]): void {
  const current = new Set(getArchivedActivityIds());
  for (const id of activityIds) {
    current.add(id);
  }
  writeJson(ACTIVITIES_ARCHIVED_KEY, Array.from(current));
}

export function unarchiveActivity(activityId: string): void {
  writeJson(
    ACTIVITIES_ARCHIVED_KEY,
    getArchivedActivityIds().filter((id) => id !== activityId),
  );
}

export function saveFilterView(
  viewTab: SavedFilterView["viewTab"],
  filters: ActivityFilters,
): void {
  const payload: SavedFilterView = {
    viewTab,
    filters,
    savedAt: new Date().toISOString(),
  };
  writeJson(ACTIVITIES_FILTER_VIEW_KEY, payload);
}

export function loadFilterView(): SavedFilterView | null {
  const saved = readJson<SavedFilterView | null>(
    ACTIVITIES_FILTER_VIEW_KEY,
    null,
  );

  if (!saved?.filters) {
    return null;
  }

  return {
    viewTab: saved.viewTab ?? "all",
    filters: { ...DEFAULT_ACTIVITY_FILTERS, ...saved.filters },
    savedAt: saved.savedAt ?? new Date().toISOString(),
  };
}

export function clearFilterView(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ACTIVITIES_FILTER_VIEW_KEY);
}

export function resetActivityFilters(): ActivityFilters {
  return { ...DEFAULT_ACTIVITY_FILTERS };
}
