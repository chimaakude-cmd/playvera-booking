"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PanelRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LoadingState } from "@/components/club/LoadingState";
import { StickySearchBar } from "./StickySearchBar";
import { SessionsTrustBar } from "./SessionsTrustBar";
import { CategoryDiscoveryCards } from "./CategoryDiscoveryCards";
import { DiscoverySocialProofBar } from "./DiscoverySocialProofBar";
import { SessionResultCard } from "./SessionResultCard";
import { SessionsEmptyState } from "./SessionsEmptyState";
import { HOME_BUTTON, HOME_CARD } from "@/components/home/shared";
import {
  buildSessionsUrl,
  type HomeSearchFilters,
} from "@/lib/home/search-url";
import {
  DEFAULT_DISCOVERY_FILTERS,
  DISCOVERY_CATEGORY_BADGES,
  DISCOVERY_RADIUS,
  SAVED_FILTERS_KEY,
  type SortOption,
} from "@/lib/discovery/constants";
import { sortSessions } from "@/lib/discovery/sort-sessions";
import { loadSessionsWithMeta } from "@/lib/data/providers/resilient-sessions";
import { geocodeSearchQuery } from "@/lib/geocoding";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  getSessionDistanceMiles,
  hasValidSessionCoordinates,
  type SessionCoordinates,
} from "@/lib/session-coordinates";
import {
  filterSessionsForParentPage,
  type ParentSessionSearchFilters,
} from "@/lib/session-search";
import type { ClubSession } from "@/lib/sessions";
import {
  ACTIVORA_ACTION,
  ACTIVORA_ACCENT,
} from "@/lib/home/constants";

const SessionsMap = dynamic(
  () => import("@/components/sessions/SessionsMap").then((m) => m.SessionsMap),
  { ssr: false, loading: () => <LoadingState message="Loading map…" /> },
);

const PAGE_SIZE = 12;

function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
): HomeSearchFilters {
  return {
    location: searchParams.get("location") ?? "",
    childAge: searchParams.get("childAge") ?? "",
    radius: searchParams.get("radius") ?? "10",
    activity: searchParams.get("activity") ?? "",
    date: searchParams.get("date") ?? "",
  };
}

function toParentFilters(filters: HomeSearchFilters): ParentSessionSearchFilters {
  return {
    location: filters.location,
    radius: filters.radius,
    childAge: filters.childAge,
    activity: filters.activity,
  };
}

function SessionCardSkeleton() {
  return (
    <div className={`discovery-session-card animate-pulse border border-slate-200 bg-white ${DISCOVERY_RADIUS.sessionCard}`}>
      <div className={`aspect-video bg-slate-100 ${DISCOVERY_RADIUS.sessionCard}`} />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 rounded bg-slate-100" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className={`h-9 w-32 bg-slate-100 ${DISCOVERY_RADIUS.button}`} />
      </div>
    </div>
  );
}

export function SessionsDiscoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [filters, setFilters] = useState<HomeSearchFilters>(DEFAULT_DISCOVERY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<HomeSearchFilters>(DEFAULT_DISCOVERY_FILTERS);
  const [searchCenter, setSearchCenter] = useState<SessionCoordinates | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const sort: SortOption = "nearest";
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filtersSaved, setFiltersSaved] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const initial = parseFiltersFromSearchParams(
      new URLSearchParams(searchParams.toString()),
    );
    setFilters(initial);
    setAppliedFilters(initial);
  }, [searchParams]);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      setError(null);
      try {
        const result = await loadSessionsWithMeta();
        setSessions(result.data);
        setError(result.error ?? null);
      } catch (loadError) {
        setSessions([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load sessions.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadSessions();
  }, []);

  const geocodedSessions = useMemo(
    () => sessions.filter(hasValidSessionCoordinates),
    [sessions],
  );

  const filteredResults = useMemo(() => {
    const filtered = filterSessionsForParentPage(
      geocodedSessions,
      toParentFilters(appliedFilters),
      searchCenter,
    );
    return sortSessions(
      filtered,
      sort,
      toParentFilters(appliedFilters),
      searchCenter,
    );
  }, [geocodedSessions, appliedFilters, searchCenter, sort]);

  const visibleResults = useMemo(
    () => filteredResults.slice(0, visibleCount),
    [filteredResults, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [appliedFilters, sort]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, filteredResults.length),
          );
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredResults.length, loading, visibleCount]);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setFocusSessionId(sessionId);
    cardRefs.current.get(sessionId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, []);

  async function handleSearch() {
    setSearchError(null);
    const locationQuery = filters.location.trim();

    if (locationQuery) {
      try {
        const geocoded = await geocodeSearchQuery(locationQuery);
        setSearchCenter({
          lat: geocoded.latitude,
          lng: geocoded.longitude,
        });
      } catch (geocodeError) {
        setSearchCenter(null);
        setSearchError(
          geocodeError instanceof Error
            ? geocodeError.message
            : "We could not find this location.",
        );
      }
    } else {
      setSearchCenter(null);
    }

    setAppliedFilters(filters);
    setFocusSessionId(null);
    setPreviewSessionId(null);
    router.push(buildSessionsUrl(filters));
  }

  function handleFiltersChange(updates: Partial<HomeSearchFilters>) {
    setFilters((current) => ({ ...current, ...updates }));
  }

  function handleCategorySelect(query: string) {
    const next = { ...filters, activity: query };
    setFilters(next);
    setAppliedFilters(next);
    router.push(buildSessionsUrl(next, query || undefined));
  }

  function handleClearFilters() {
    const cleared = { ...DEFAULT_DISCOVERY_FILTERS };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setSearchCenter(null);
    setSearchError(null);
    router.push("/sessions");
  }

  function handleSaveFilters() {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(appliedFilters));
    setFiltersSaved(true);
    window.setTimeout(() => setFiltersSaved(false), 2000);
  }

  function handleLoadSavedFilters() {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(SAVED_FILTERS_KEY);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw) as HomeSearchFilters;
      setFilters(saved);
      setAppliedFilters(saved);
      router.push(buildSessionsUrl(saved));
    } catch {
      // ignore invalid saved filters
    }
  }

  const showMap = isLargeScreen;
  const resultsLabel = loading
    ? "Loading activities…"
    : `Showing ${filteredResults.length} ${filteredResults.length === 1 ? "activity" : "activities"}`;

  return (
    <div className="flex min-h-full flex-col bg-[#F8FAFC] font-[family-name:var(--font-inter)] text-[#0F172A]">
      <HomeHeader />

      <StickySearchBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={() => void handleSearch()}
        searchError={searchError}
      />

      <section className="border-b border-slate-200/60 bg-white py-5 sm:py-6">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] sm:text-2xl">
                Explore by activity
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Find sessions your child will love.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DISCOVERY_CATEGORY_BADGES.map((badge) => (
                <button
                  key={badge.label}
                  type="button"
                  onClick={() => handleCategorySelect(badge.query)}
                  className={`inline-flex shrink-0 items-center gap-1 border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#0F172A] transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 sm:text-xs ${DISCOVERY_RADIUS.button}`}
                >
                  <span aria-hidden>{badge.icon}</span>
                  {badge.label}
                </button>
              ))}
            </div>
          </div>
          <CategoryDiscoveryCards
            activeQuery={appliedFilters.activity}
            onSelect={handleCategorySelect}
          />
        </div>
      </section>

      <DiscoverySocialProofBar
        location={appliedFilters.location}
        sessionCount={filteredResults.length || 217}
      />

      <SessionsTrustBar />

      {error ? (
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-4 sm:px-6 lg:flex-row lg:gap-0">
        <section className="flex min-h-0 flex-col lg:w-[60%] lg:pr-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-[#0F172A] sm:text-xl">
                  Activities near you
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  {resultsLabel}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className={`border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] lg:hidden ${DISCOVERY_RADIUS.button}`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                  Filters
                </button>

                <span
                  className={`inline-flex items-center border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] ${DISCOVERY_RADIUS.button}`}
                >
                  Nearest
                </span>

                <span
                  className={`hidden items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2563EB] lg:inline-flex ${DISCOVERY_RADIUS.button}`}
                  aria-current="true"
                >
                  <PanelRight className="h-3.5 w-3.5" aria-hidden />
                  Split
                </span>

                <button
                  type="button"
                  onClick={handleSaveFilters}
                  className={`border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] transition-colors hover:border-blue-200 hover:bg-blue-50 ${DISCOVERY_RADIUS.button}`}
                >
                  {filtersSaved ? "Saved!" : "Save filters"}
                </button>
                <button
                  type="button"
                  onClick={handleLoadSavedFilters}
                  className={`border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 ${DISCOVERY_RADIUS.button}`}
                >
                  Load saved
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 pb-6 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-1">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SessionCardSkeleton key={index} />
                  ))}
                </div>
              ) : filteredResults.length === 0 ? (
                <SessionsEmptyState
                  filters={appliedFilters}
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <>
                  {visibleResults.map((session) => {
                    const distanceMiles = appliedFilters.location.trim()
                      ? getSessionDistanceMiles(
                          session,
                          appliedFilters.location,
                          searchCenter,
                        )
                      : null;
                    const distanceLabel =
                      distanceMiles !== null
                        ? `${distanceMiles.toFixed(1)} mi`
                        : null;

                    return (
                      <div
                        key={session.id}
                        ref={(element) => {
                          if (element) {
                            cardRefs.current.set(session.id, element);
                          }
                        }}
                      >
                        <SessionResultCard
                          session={session}
                          distanceLabel={distanceLabel}
                          isActive={activeSessionId === session.id}
                          isPreviewOpen={
                            isLargeScreen && previewSessionId === session.id
                          }
                          enablePreview={isLargeScreen}
                          onHover={() => {
                            setActiveSessionId(session.id);
                            setPreviewSessionId(session.id);
                          }}
                          onLeave={() => {
                            setActiveSessionId(null);
                            setPreviewSessionId(null);
                          }}
                          onTap={() => {
                            if (!isLargeScreen) {
                              setPreviewSessionId((current) =>
                                current === session.id ? null : session.id,
                              );
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                  {visibleCount < filteredResults.length ? (
                    <div ref={loadMoreRef} className="py-4 text-center">
                      <p className="text-xs text-slate-500">Loading more…</p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>

        {showMap ? (
          <aside className="relative hidden lg:block lg:w-[40%]">
            <div className="sticky top-[88px]">
              <div className="mb-2 px-1">
                <p className="text-xs font-semibold text-slate-500">Map view</p>
              </div>
              <div
                className={`discovery-floating-map h-[calc(100vh-300px)] min-h-[420px] overflow-hidden border border-slate-200/80 shadow-2xl shadow-slate-900/10 ${DISCOVERY_RADIUS.map}`}
              >
                <SessionsMap
                  sessions={filteredResults}
                  activeSessionId={activeSessionId}
                  focusSessionId={focusSessionId}
                  onSessionSelect={handleSessionSelect}
                  searchCenter={searchCenter}
                  radiusMiles={Number(appliedFilters.radius) || 10}
                />
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold text-[#0F172A]">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
            Tell us what activity you need and we&apos;ll help connect you with
            verified providers in your area.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/contact"
              className={`inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${HOME_BUTTON}`}
              style={{
                background: `linear-gradient(135deg, ${ACTIVORA_ACTION}, ${ACTIVORA_ACCENT})`,
              }}
            >
              Request an activity
            </Link>
            <button
              type="button"
              onClick={handleClearFilters}
              className={`inline-flex items-center border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-[#0F172A] ${HOME_BUTTON}`}
            >
              Browse all activities
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] border-t border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A]">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="mobile-location" className="mb-1 block text-xs font-semibold text-slate-600">
                  Location
                </label>
                <input
                  id="mobile-location"
                  type="text"
                  value={filters.location}
                  onChange={(event) =>
                    handleFiltersChange({ location: event.target.value })
                  }
                  className={`w-full border border-slate-200 px-3 py-2.5 text-sm ${HOME_BUTTON}`}
                />
              </div>
              <div>
                <label htmlFor="mobile-age" className="mb-1 block text-xs font-semibold text-slate-600">
                  Child age
                </label>
                <input
                  id="mobile-age"
                  type="text"
                  value={filters.childAge}
                  onChange={(event) =>
                    handleFiltersChange({ childAge: event.target.value })
                  }
                  className={`w-full border border-slate-200 px-3 py-2.5 text-sm ${HOME_BUTTON}`}
                />
              </div>
              <div>
                <label htmlFor="mobile-date" className="mb-1 block text-xs font-semibold text-slate-600">
                  Date
                </label>
                <input
                  id="mobile-date"
                  type="date"
                  value={filters.date}
                  onChange={(event) =>
                    handleFiltersChange({ date: event.target.value })
                  }
                  className={`w-full border border-slate-200 px-3 py-2.5 text-sm ${HOME_BUTTON}`}
                />
              </div>
              <div>
                <label htmlFor="mobile-activity" className="mb-1 block text-xs font-semibold text-slate-600">
                  Activity
                </label>
                <input
                  id="mobile-activity"
                  type="text"
                  value={filters.activity}
                  onChange={(event) =>
                    handleFiltersChange({ activity: event.target.value })
                  }
                  className={`w-full border border-slate-200 px-3 py-2.5 text-sm ${HOME_BUTTON}`}
                />
              </div>
              <div>
                <label htmlFor="mobile-radius" className="mb-1 block text-xs font-semibold text-slate-600">
                  Radius
                </label>
                <select
                  id="mobile-radius"
                  value={filters.radius}
                  onChange={(event) =>
                    handleFiltersChange({ radius: event.target.value })
                  }
                  className={`w-full border border-slate-200 px-3 py-2.5 text-sm ${HOME_BUTTON}`}
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="15">15 miles</option>
                  <option value="25">25 miles</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleSearch();
                  setMobileFiltersOpen(false);
                }}
                className={`flex-1 py-2.5 text-xs font-semibold text-white ${HOME_BUTTON}`}
                style={{
                  background: `linear-gradient(135deg, ${ACTIVORA_ACTION}, ${ACTIVORA_ACCENT})`,
                }}
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className={`border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#0F172A] ${HOME_BUTTON}`}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
