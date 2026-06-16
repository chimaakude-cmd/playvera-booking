"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACTIVITY_CATEGORY_LABELS,
  filterActivities,
  getActivitiesByPopularity,
  type ActivityChip,
} from "@/lib/home/activity-catalog";
import { buildSessionsUrl, type HomeSearchFilters } from "@/lib/home/search-url";
import { useTranslation } from "@/lib/i18n";
import {
  getHomepageFeaturedActivities,
  HomeActivityMorePanel,
} from "./HomeActivityMorePanel";
import { HOME_BUTTON, HOME_CARD } from "./shared";

type HomeActivityChipsProps = {
  filters: HomeSearchFilters;
};

const CHIP_CLASS = `inline-flex shrink-0 items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${HOME_BUTTON}`;

const SEARCH_INPUT_CLASS = `w-full ${HOME_BUTTON} border border-slate-200 bg-white px-3.5 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100`;

function ActivityChipLink({
  activity,
  filters,
}: {
  activity: ActivityChip;
  filters: HomeSearchFilters;
}) {
  return (
    <Link
      href={buildSessionsUrl(filters, activity.query)}
      className={CHIP_CLASS}
    >
      <span aria-hidden>{activity.icon}</span>
      {activity.label}
    </Link>
  );
}

export function HomeActivityChips({ filters }: HomeActivityChipsProps) {
  const { t } = useTranslation("homepage");
  const [searchQuery, setSearchQuery] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const sortedActivities = useMemo(() => getActivitiesByPopularity(), []);
  const featuredActivities = useMemo(() => getHomepageFeaturedActivities(), []);

  const filteredActivities = useMemo(
    () => filterActivities(searchQuery),
    [searchQuery],
  );

  const autocompleteItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedActivities.slice(0, 8);
    }
    return filteredActivities.slice(0, 8);
  }, [searchQuery, filteredActivities, sortedActivities]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [panelOpen]);

  function handleSuggestionSelect(activity: ActivityChip) {
    setSearchQuery(activity.label);
    setShowSuggestions(false);
    window.location.href = buildSessionsUrl(filters, activity.query);
  }

  return (
    <>
      <section className="border-b border-slate-200/60 bg-[#F8FAFC] pb-12 pt-4 sm:pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              {t("chips.title")}
            </p>

            <div ref={searchRef} className="relative w-full sm:max-w-xs">
              <label htmlFor="browse-activity-search" className="sr-only">
                {t("chips.searchLabel")}
              </label>
              <input
                id="browse-activity-search"
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t("chips.searchPlaceholder")}
                className={SEARCH_INPUT_CLASS}
                autoComplete="off"
              />

              {showSuggestions && autocompleteItems.length > 0 ? (
                <div
                  className={`absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto border border-slate-200 bg-white shadow-xl ${HOME_CARD}`}
                >
                  {autocompleteItems.map((activity) => (
                    <button
                      key={activity.label}
                      type="button"
                      onClick={() => handleSuggestionSelect(activity)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <span aria-hidden>{activity.icon}</span>
                      <span className="flex-1">{activity.label}</span>
                      <span className="text-xs text-slate-400">
                        {ACTIVITY_CATEGORY_LABELS[activity.group]}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {showSuggestions &&
              searchQuery.trim() &&
              autocompleteItems.length === 0 ? (
                <div
                  className={`absolute left-0 right-0 top-full z-20 mt-1.5 border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-xl ${HOME_CARD}`}
                >
                  {t("chips.noResults")}
                </div>
              ) : null}
            </div>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            {featuredActivities.map((activity) => (
              <ActivityChipLink
                key={activity.label}
                activity={activity}
                filters={filters}
              />
            ))}

            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              aria-haspopup="dialog"
              className={CHIP_CLASS}
            >
              {t("chips.more")}
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </section>

      <HomeActivityMorePanel
        open={panelOpen}
        filters={filters}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
}
