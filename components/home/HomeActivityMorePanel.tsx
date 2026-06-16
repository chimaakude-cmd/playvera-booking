"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_CATEGORY_ORDER,
  filterActivities,
  getActivitiesByPopularity,
  groupActivitiesByCategory,
  INITIAL_ACTIVITY_VISIBLE_COUNT,
  type ActivityChip,
} from "@/lib/home/activity-catalog";
import { buildSessionsUrl, type HomeSearchFilters } from "@/lib/home/search-url";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_CARD } from "./shared";

type HomeActivityMorePanelProps = {
  open: boolean;
  filters: HomeSearchFilters;
  onClose: () => void;
};

function ActivityLink({
  activity,
  filters,
  onNavigate,
}: {
  activity: ActivityChip;
  filters: HomeSearchFilters;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={buildSessionsUrl(filters, activity.query)}
      onClick={onNavigate}
      className={`inline-flex items-center gap-2 border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#0F172A] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${HOME_BUTTON}`}
    >
      <span aria-hidden>{activity.icon}</span>
      {activity.label}
    </Link>
  );
}

export function HomeActivityMorePanel({
  open,
  filters,
  onClose,
}: HomeActivityMorePanelProps) {
  const { t } = useTranslation("homepage");
  const [searchQuery, setSearchQuery] = useState("");

  useModalDismiss(open, onClose);

  const filteredActivities = useMemo(
    () => filterActivities(searchQuery),
    [searchQuery],
  );

  const groupedActivities = useMemo(
    () => groupActivitiesByCategory(filteredActivities),
    [filteredActivities],
  );

  const hasResults = filteredActivities.length > 0;

  if (!open) {
    return null;
  }

  function handleClose() {
    setSearchQuery("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t("chips.panelClose")}
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("chips.panelTitle")}
        className={`relative flex max-h-[min(90vh,720px)] w-full flex-col bg-white shadow-2xl sm:max-w-2xl ${HOME_CARD} rounded-t-[20px] sm:rounded-[20px]`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-[#0F172A]">
            {t("chips.panelTitle")}
          </h2>
          <button
            type="button"
            aria-label={t("chips.panelClose")}
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 px-4 pb-3 pt-1 sm:px-6">
          <label htmlFor="activity-panel-search" className="sr-only">
            {t("chips.searchLabel")}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="activity-panel-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("chips.searchPlaceholder")}
              className={`w-full py-2.5 pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none ${HOME_BUTTON} border border-slate-200 bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100`}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
          {!hasResults ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {t("chips.noResults")}
            </p>
          ) : searchQuery.trim() ? (
            <div className="flex flex-wrap gap-2">
              {filteredActivities.map((activity) => (
                <ActivityLink
                  key={activity.label}
                  activity={activity}
                  filters={filters}
                  onNavigate={handleClose}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {ACTIVITY_CATEGORY_ORDER.map((group) => {
                const items = groupedActivities[group];
                if (!items?.length) {
                  return null;
                }

                return (
                  <section key={group}>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      {ACTIVITY_CATEGORY_LABELS[group]}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {items.map((activity) => (
                        <ActivityLink
                          key={activity.label}
                          activity={activity}
                          filters={filters}
                          onNavigate={handleClose}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Popular activities shown in the homepage row before the More tile. */
export function getHomepageFeaturedActivities(): ActivityChip[] {
  return getActivitiesByPopularity().slice(0, INITIAL_ACTIVITY_VISIBLE_COUNT);
}
