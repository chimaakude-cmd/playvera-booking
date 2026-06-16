"use client";

import type {
  ActivityFilterOptions,
  ActivityFilters,
  ActivityViewTab,
} from "@/lib/club-activities";
import {
  ACTIVITY_VIEW_TABS,
  ALL_DAY_KEYS,
  DEFAULT_ACTIVITY_FILTERS,
} from "@/lib/club-activities";
import { formatActivityType } from "@/lib/sessions";

type ActivitiesFiltersProps = {
  viewTab: ActivityViewTab;
  filters: ActivityFilters;
  options: ActivityFilterOptions;
  savedFilterLabel?: string | null;
  onViewTabChange: (tab: ActivityViewTab) => void;
  onFiltersChange: (filters: ActivityFilters) => void;
  onSaveFilterView: () => void;
  onReset: () => void;
};

const selectClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

export function ActivitiesFilters({
  viewTab,
  filters,
  options,
  savedFilterLabel,
  onViewTabChange,
  onFiltersChange,
  onSaveFilterView,
  onReset,
}: ActivitiesFiltersProps) {
  function updateFilter<K extends keyof ActivityFilters>(
    key: K,
    value: ActivityFilters[K],
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const hasActiveFilters =
    filters.query.trim() !== "" ||
    filters.activityType !== "all" ||
    filters.venue !== "all" ||
    filters.ageGroup !== "all" ||
    filters.category !== "all" ||
    filters.visibility !== "all" ||
    filters.dayOfWeek !== "all" ||
    viewTab !== "all";

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onViewTabChange(tab.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              viewTab === tab.id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input
          type="search"
          value={filters.query}
          onChange={(event) => updateFilter("query", event.target.value)}
          placeholder="Search activities..."
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 xl:col-span-2"
        />

        <select
          value={filters.activityType}
          onChange={(event) => updateFilter("activityType", event.target.value)}
          className={selectClass}
        >
          <option value="all">All types</option>
          {options.activityTypes.map((type) => (
            <option key={type} value={type}>
              {formatActivityType(type)}
            </option>
          ))}
        </select>

        <select
          value={filters.venue}
          onChange={(event) => updateFilter("venue", event.target.value)}
          className={selectClass}
        >
          <option value="all">All venues</option>
          {options.venues.map((venue) => (
            <option key={venue} value={venue}>
              {venue}
            </option>
          ))}
        </select>

        <select
          value={filters.ageGroup}
          onChange={(event) => updateFilter("ageGroup", event.target.value)}
          className={selectClass}
        >
          <option value="all">All ages</option>
          {options.ageGroups.map((age) => (
            <option key={age} value={age}>
              {age}
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
        >
          <option value="all">All visibility</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>

        <select
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value)}
          className={selectClass}
        >
          <option value="all">All categories</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={filters.dayOfWeek}
          onChange={(event) => updateFilter("dayOfWeek", event.target.value)}
          className={selectClass}
        >
          <option value="all">Any day</option>
          {ALL_DAY_KEYS.map((day) => (
            <option key={day} value={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {savedFilterLabel ? (
          <p className="text-xs text-teal-700">
            Saved filter view · {savedFilterLabel}
          </p>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveFilterView}
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
          >
            Save filter view
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_ACTIVITY_FILTERS };
