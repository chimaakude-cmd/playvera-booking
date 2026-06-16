"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import {
  ACTIVORA_ACTION,
  ACTIVORA_ACCENT,
} from "@/lib/home/constants";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import { HOME_CARD } from "@/components/home/shared";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";
import { SmartSearchSuggestions } from "./SmartSearchSuggestions";

const INPUT_CLASS = `discovery-search-input h-10 w-full ${DISCOVERY_RADIUS.input} border border-slate-200 bg-white px-3 text-sm text-[#0F172A] placeholder:text-slate-400 transition-all duration-200 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100`;

type StickySearchBarProps = {
  filters: HomeSearchFilters;
  onFiltersChange: (updates: Partial<HomeSearchFilters>) => void;
  onSearch: () => void;
  searchError?: string | null;
};

export function StickySearchBar({
  filters,
  onFiltersChange,
  onSearch,
  searchError,
}: StickySearchBarProps) {
  const [locating, setLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const activityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        activityRef.current &&
        !activityRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleUseLocation() {
    if (!navigator.geolocation) {
      onFiltersChange({ location: "London" });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        onFiltersChange({ location: "Near me" });
        setLocating(false);
      },
      () => {
        onFiltersChange({ location: "London" });
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#F8FAFC]/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {searchError ? (
          <p className="pt-2 text-xs font-medium text-red-600">{searchError}</p>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
          className={`discovery-search-bar my-3 flex min-h-[72px] items-center gap-2 border border-slate-200/90 bg-white/95 px-3 py-2 shadow-sm shadow-slate-900/5 backdrop-blur-sm transition-all duration-200 sm:gap-3 sm:px-4 ${DISCOVERY_RADIUS.searchPill}`}
        >
          <div className="hidden min-w-0 flex-1 sm:block">
            <label htmlFor="discovery-location" className="sr-only">
              Location
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="discovery-location"
                type="text"
                value={filters.location}
                onChange={(event) =>
                  onFiltersChange({ location: event.target.value })
                }
                placeholder="Location or postcode"
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
          </div>

          <div className="hidden w-28 lg:block">
            <label htmlFor="discovery-age" className="sr-only">
              Child age
            </label>
            <input
              id="discovery-age"
              type="text"
              value={filters.childAge}
              onChange={(event) =>
                onFiltersChange({ childAge: event.target.value })
              }
              placeholder="Age"
              className={INPUT_CLASS}
            />
          </div>

          <div className="hidden w-32 xl:block">
            <label htmlFor="discovery-date" className="sr-only">
              Date
            </label>
            <input
              id="discovery-date"
              type="date"
              value={filters.date}
              onChange={(event) =>
                onFiltersChange({ date: event.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>

          <div className="relative min-w-0 flex-1" ref={activityRef}>
            <label htmlFor="discovery-activity" className="sr-only">
              Activity
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="discovery-activity"
                type="text"
                value={filters.activity}
                onChange={(event) => {
                  onFiltersChange({ activity: event.target.value });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Activity"
                className={`${INPUT_CLASS} pl-9`}
                autoComplete="off"
              />
            </div>
            {showSuggestions && filters.activity.trim() ? (
              <SmartSearchSuggestions
                query={filters.activity}
                onSelect={(value) => {
                  onFiltersChange({ activity: value });
                  setShowSuggestions(false);
                }}
              />
            ) : null}
          </div>

          <div className="hidden w-24 md:block">
            <label htmlFor="discovery-radius" className="sr-only">
              Radius
            </label>
            <select
              id="discovery-radius"
              value={filters.radius}
              onChange={(event) =>
                onFiltersChange({ radius: event.target.value })
              }
              className={INPUT_CLASS}
            >
              <option value="5">5 mi</option>
              <option value="10">10 mi</option>
              <option value="15">15 mi</option>
              <option value="25">25 mi</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleUseLocation}
            className={`hidden shrink-0 items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] transition-colors hover:border-blue-200 hover:bg-blue-50 lg:inline-flex ${DISCOVERY_RADIUS.button}`}
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            {locating ? "Locating…" : "Use my location"}
          </button>

          <button
            type="submit"
            className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:px-5 ${DISCOVERY_RADIUS.button}`}
            style={{
              background: `linear-gradient(135deg, ${ACTIVORA_ACTION}, ${ACTIVORA_ACCENT})`,
            }}
          >
            <Search className="h-3.5 w-3.5 sm:hidden" aria-hidden />
            <span>Search</span>
          </button>
        </form>
      </div>
    </div>
  );
}
