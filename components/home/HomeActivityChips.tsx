"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  ACTIVITY_CATEGORY_LABELS,
  filterActivities,
  getActivitiesByPopularity,
  type ActivityChip,
} from "@/lib/home/activity-catalog";
import { ActivityIcon } from "@/lib/home/activity-icons";
import { ACTIVORA_GRADIENT } from "@/lib/home/constants";
import { buildSessionsUrl, type HomeSearchFilters } from "@/lib/home/search-url";
import { useTranslation } from "@/lib/i18n";
import {
  getHomepageFeaturedActivities,
  HomeActivityMorePanel,
} from "./HomeActivityMorePanel";
import { HOME_BUTTON, HOME_CARD, HOME_SHADOW } from "./shared";

type HomeActivityChipsProps = {
  filters: HomeSearchFilters;
};

const CHIP_CLASS = `group inline-flex shrink-0 items-center gap-3 border border-slate-200/80 bg-white px-5 py-3.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:px-6 sm:py-4 sm:text-base ${HOME_BUTTON} ${HOME_SHADOW}`;

const SEARCH_INPUT_CLASS = `w-full ${HOME_BUTTON} border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100`;

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
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105 sm:h-11 sm:w-11"
        style={{ background: ACTIVORA_GRADIENT }}
      >
        <ActivityIcon activity={activity} className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" />
      </span>
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
      <section className="border-b border-slate-200/60 bg-[#F8FAFC] pb-16 pt-6 sm:pb-20 sm:pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[#0F172A] sm:text-xl">
              {t("chips.title")}
            </h2>

            <div ref={searchRef} className="relative w-full sm:max-w-sm">
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
                  className={`absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto border border-slate-200 bg-white ${HOME_CARD} ${HOME_SHADOW}`}
                >
                  {autocompleteItems.map((activity) => (
                    <button
                      key={activity.label}
                      type="button"
                      onClick={() => handleSuggestionSelect(activity)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50/60"
                    >
                      <ActivityIcon activity={activity} className="h-4 w-4 text-violet-600" />
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
                  className={`absolute left-0 right-0 top-full z-20 mt-2 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 ${HOME_CARD} ${HOME_SHADOW}`}
                >
                  {t("chips.noResults")}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative -mx-4 sm:-mx-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#F8FAFC] to-transparent sm:w-8" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#F8FAFC] to-transparent sm:w-8" />
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-1 scrollbar-none sm:gap-4 sm:px-6">
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
                className={`${CHIP_CLASS} border-dashed`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 sm:h-11 sm:w-11"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </span>
                {t("chips.more")}
              </button>
            </div>
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
