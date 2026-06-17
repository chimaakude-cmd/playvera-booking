"use client";

import Link from "next/link";
import { Bell, Globe, MapPin, Sparkles, TrendingUp } from "lucide-react";
import { LogoMark } from "@/components/branding";
import { buildSessionsUrl } from "@/lib/home/search-url";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import { getNoResultsSuggestions } from "@/lib/ai/search-assistant";

type SessionsEmptyStateProps = {
  filters: HomeSearchFilters;
  onClearFilters: () => void;
  onAdjustFilters?: (updates: Partial<HomeSearchFilters>) => void;
};

const FALLBACK_SECTIONS = [
  {
    title: "Popular near you",
    icon: MapPin,
    query: "Football",
    description: "Top-rated football clubs families book every week.",
  },
  {
    title: "Trending nationally",
    icon: TrendingUp,
    query: "Swimming",
    description: "Swimming lessons climbing the charts across the UK.",
  },
  {
    title: "Online activities",
    icon: Globe,
    query: "tutoring",
    description: "Live online tutoring and creative workshops from home.",
  },
  {
    title: "Nearby schools",
    icon: Sparkles,
    query: "wraparound",
    description: "After-school clubs running at schools near you.",
  },
] as const;

export function SessionsEmptyState({
  filters,
  onClearFilters,
  onAdjustFilters,
}: SessionsEmptyStateProps) {
  const locationLabel = filters.location.trim() || "you";
  const suggestions = getNoResultsSuggestions(filters);

  return (
    <div className="space-y-6">
      <div
        className={`mx-auto max-w-lg border border-dashed border-slate-200 bg-white px-6 py-10 text-center ${DISCOVERY_RADIUS.card}`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <LogoMark size={64} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[#0F172A]">
          No exact matches — try these instead
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          We couldn&apos;t find activities matching every filter. Explore
          popular options near {locationLabel} or widen your search.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => onAdjustFilters?.(suggestion.updates)}
              className={`inline-flex items-center border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-[#2563EB] transition-colors hover:border-blue-300 hover:bg-blue-100 ${DISCOVERY_RADIUS.button}`}
            >
              {suggestion.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClearFilters}
            className={`inline-flex items-center border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] transition-colors hover:border-blue-200 hover:bg-blue-50 ${DISCOVERY_RADIUS.button}`}
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={() => {
              window.alert(
                "We'll notify you when matching activities are available.",
              );
            }}
            className={`inline-flex items-center gap-1.5 border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] transition-colors hover:border-blue-200 hover:bg-blue-50 ${DISCOVERY_RADIUS.button}`}
          >
            <Bell className="h-3.5 w-3.5" aria-hidden />
            Notify me
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FALLBACK_SECTIONS.map((section) => {
          const Icon = section.icon;
          const title =
            section.title === "Popular near you"
              ? `Popular near ${locationLabel}`
              : section.title;

          return (
            <Link
              key={section.title}
              href={buildSessionsUrl({ ...filters, activity: section.query })}
              className={`discovery-session-card group border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/40 ${DISCOVERY_RADIUS.card}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center bg-blue-50 text-[#2563EB] ${DISCOVERY_RADIUS.button}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB]">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {section.description}
                  </p>
                  <span className="mt-2 inline-block text-xs font-semibold text-[#2563EB]">
                    Browse →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
