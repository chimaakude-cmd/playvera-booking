"use client";

import Link from "next/link";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import { EmptyRecommendations } from "./EmptyRecommendations";

type SessionsEmptyStateProps = {
  filters: HomeSearchFilters;
  onClearFilters: () => void;
  onAdjustFilters?: (updates: Partial<HomeSearchFilters>) => void;
  onBrowsePopular?: () => void;
};

const RADIUS_STEPS = ["5", "10", "15", "25"] as const;
const MAX_RADIUS = 25;

function getNextRadius(current: string): string | null {
  const index = RADIUS_STEPS.indexOf(current as (typeof RADIUS_STEPS)[number]);
  if (index === -1 || index >= RADIUS_STEPS.length - 1) {
    return null;
  }
  return RADIUS_STEPS[index + 1];
}

function incrementRadius(current: string, miles: number): string | null {
  const currentNum = Number(current) || 10;
  if (currentNum >= MAX_RADIUS) {
    return null;
  }
  return String(Math.min(currentNum + miles, MAX_RADIUS));
}

function isSearchTooNarrow(filters: HomeSearchFilters): boolean {
  return Boolean(
    filters.activity.trim() ||
      filters.childAge.trim() ||
      filters.date.trim() ||
      (Number(filters.radius) || 10) < MAX_RADIUS,
  );
}

export function SessionsEmptyState({
  filters,
  onClearFilters,
  onAdjustFilters,
  onBrowsePopular,
}: SessionsEmptyStateProps) {
  const nextRadius = getNextRadius(filters.radius);
  const plusFive = incrementRadius(filters.radius, 5);
  const plusTen = incrementRadius(filters.radius, 10);
  const locationLabel = filters.location.trim() || "you";
  const showSmartEmpty = isSearchTooNarrow(filters);

  return (
    <div className="w-full space-y-8">
      <div
        className={`mx-auto w-full border border-orange-100/80 bg-white px-6 py-10 text-center shadow-sm sm:px-10 ${DISCOVERY_RADIUS.card}`}
      >
        <h2 className="text-xl font-bold text-[#0F172A] sm:text-2xl">
          No activities found
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
          We couldn&apos;t find activities matching your search near{" "}
          {locationLabel}. Try adjusting your filters or explore suggestions
          below.
        </p>

        {showSmartEmpty ? (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-orange-100/60 bg-[#FFFBF7] px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-[#0F172A]">
              Try widening your search to discover more activities.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {plusFive && onAdjustFilters ? (
                <button
                  type="button"
                  onClick={() => onAdjustFilters({ radius: plusFive })}
                  className={`inline-flex items-center border border-orange-200/80 bg-white px-3 py-2 text-xs font-semibold text-[#2563EB] transition-colors hover:border-orange-300 hover:bg-orange-50 ${DISCOVERY_RADIUS.button}`}
                >
                  +5 miles
                </button>
              ) : null}
              {plusTen &&
              onAdjustFilters &&
              plusTen !== plusFive ? (
                <button
                  type="button"
                  onClick={() => onAdjustFilters({ radius: plusTen })}
                  className={`inline-flex items-center border border-orange-200/80 bg-white px-3 py-2 text-xs font-semibold text-[#2563EB] transition-colors hover:border-orange-300 hover:bg-orange-50 ${DISCOVERY_RADIUS.button}`}
                >
                  +10 miles
                </button>
              ) : null}
              {filters.childAge.trim() && onAdjustFilters ? (
                <button
                  type="button"
                  onClick={() => onAdjustFilters({ childAge: "" })}
                  className={`inline-flex items-center border border-orange-200/80 bg-white px-3 py-2 text-xs font-semibold text-[#2563EB] transition-colors hover:border-orange-300 hover:bg-orange-50 ${DISCOVERY_RADIUS.button}`}
                >
                  Remove age filter
                </button>
              ) : null}
              {filters.activity.trim() && onAdjustFilters ? (
                <button
                  type="button"
                  onClick={() => onAdjustFilters({ activity: "" })}
                  className={`inline-flex items-center border border-orange-200/80 bg-white px-3 py-2 text-xs font-semibold text-[#2563EB] transition-colors hover:border-orange-300 hover:bg-orange-50 ${DISCOVERY_RADIUS.button}`}
                >
                  Remove activity filter
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onClearFilters}
            className={`inline-flex items-center border border-orange-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-[#0F172A] transition-colors hover:border-orange-300 hover:bg-orange-50 ${DISCOVERY_RADIUS.button}`}
          >
            Clear filters
          </button>
          {nextRadius && onAdjustFilters ? (
            <button
              type="button"
              onClick={() => onAdjustFilters({ radius: nextRadius })}
              className={`inline-flex items-center border border-orange-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-[#0F172A] transition-colors hover:border-orange-300 hover:bg-orange-50 ${DISCOVERY_RADIUS.button}`}
            >
              Expand radius to {nextRadius} mi
            </button>
          ) : null}
          <Link
            href="/contact"
            className={`inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${DISCOVERY_RADIUS.button}`}
            style={{ backgroundColor: ACTIVORA_ACTION }}
          >
            Request activity
          </Link>
          <button
            type="button"
            onClick={onBrowsePopular}
            className={`inline-flex items-center border border-orange-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-[#0F172A] transition-colors hover:border-orange-300 hover:bg-orange-50 ${DISCOVERY_RADIUS.button}`}
          >
            Browse popular activities
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-base font-bold text-[#0F172A] sm:text-lg">
          You might also like
        </h3>
        <EmptyRecommendations
          filters={filters}
          locationLabel={locationLabel}
        />
      </div>
    </div>
  );
}
