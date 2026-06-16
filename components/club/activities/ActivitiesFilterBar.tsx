"use client";

import type {
  ActivityFilters,
  ActivityViewTab,
} from "@/lib/club-activities";
import {
  ACTIVITY_VIEW_TABS,
  ALL_DAY_KEYS,
  DEFAULT_ACTIVITY_FILTERS,
} from "@/lib/club-activities";
import { formatActivityType } from "@/lib/sessions";

type ActivitiesFilterBarProps = {
  viewTab: ActivityViewTab;
  filters: ActivityFilters;
  activityTypes: string[];
  venues: string[];
  ageGroups: string[];
  categories: string[];
  onViewTabChange: (tab: ActivityViewTab) => void;
  onFiltersChange: (filters: ActivityFilters) => void;
  onSaveFilterView: () => void;
  savedFilterLabel?: string | null;
};

const selectClass =
  "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

export function ActivitiesFilterBar({
  viewTab,
  filters,
  activityTypes,
  venues,
  ageGroups,
  categories,
  onViewTabChange,
  onFiltersChange,
  onSaveFilterView,
  savedFilterLabel,
}: ActivitiesFilterBarProps) {
  function updateFilter<K extends keyof ActivityFilters>(
    key: K,
    value: ActivityFilters[K],
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function clearFilters() {
    onFiltersChange(DEFAULT_ACTIVITY_FILTERS);
  }

  return (
    <div className="sticky top-0 z-20 space-y-3 border-b border-zinc-100 bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        {ACTIVITY_VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onViewTabChange(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              viewTab === tab.id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <input
          type="search"
          value={filters.query}
          onChange={(event) => updateFilter("query", event.target.value)}
          placeholder="Search activities..."
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 lg:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={filters.activityType}
            onChange={(event) =>
              updateFilter("activityType", event.target.value)
            }
            className={selectClass}
            aria-label="Activity type"
          >
            <option value="all">All types</option>
            {activityTypes.map((type) => (
              <option key={type} value={type}>
                {formatActivityType(type)}
              </option>
            ))}
          </select>

          <select
            value={filters.venue}
            onChange={(event) => updateFilter("venue", event.target.value)}
            className={selectClass}
            aria-label="Venue"
          >
            <option value="all">All venues</option>
            {venues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>

          <select
            value={filters.ageGroup}
            onChange={(event) => updateFilter("ageGroup", event.target.value)}
            className={selectClass}
            aria-label="Age group"
          >
            <option value="all">All ages</option>
            {ageGroups.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            className={selectClass}
            aria-label="Category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.visibility}
            onChange={(event) =>
              updateFilter(
                "visibility",
                event.target.value as ActivityFilters["visibility"],
              )
            }
            className={selectClass}
            aria-label="Visibility"
          >
            <option value="all">All visibility</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>

          <select
            value={filters.dayOfWeek}
            onChange={(event) => updateFilter("dayOfWeek", event.target.value)}
            className={selectClass}
            aria-label="Day of week"
          >
            <option value="all">Any day</option>
            {ALL_DAY_KEYS.map((day) => (
              <option key={day} value={day}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <button
            type="button"
            onClick={onSaveFilterView}
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
          >
            Save filter view
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Clear
          </button>
        </div>
      </div>

      {savedFilterLabel ? (
        <p className="text-xs text-teal-700">
          Saved view loaded · {savedFilterLabel}
        </p>
      ) : null}
    </div>
  );
}
