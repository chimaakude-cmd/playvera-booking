"use client";

import dynamic from "next/dynamic";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/club/LoadingState";
import { SessionImageStrip } from "@/components/sessions/SessionImage";
import { PoweredByActivoraFooter } from "@/components/PoweredByActivoraFooter";
import { Logo } from "@/components/branding";
import { loadSessionsWithMeta } from "@/lib/data/providers/resilient-sessions";
import { useMediaQuery } from "@/lib/use-media-query";
import { geocodeSearchQuery } from "@/lib/geocoding";
import { getFeeSettings } from "@/lib/fee-settings";
import { calculatePaymentBreakdown, formatMoney } from "@/lib/payments";
import {
  getSessionDistanceMiles,
  hasValidSessionCoordinates,
  type SessionCoordinates,
} from "@/lib/session-coordinates";
import {
  filterSessionsForParentPage,
  getParentSessionsResultsLabel,
  type ParentSessionSearchFilters,
} from "@/lib/session-search";
import {
  ClubSession,
  formatDay,
  formatSessionLocation,
  formatTimeRange,
  getTicketPriceSummary,
} from "@/lib/sessions";
import { getSessionImages } from "@/lib/session-images";

const SessionsMap = dynamic(
  () => import("@/components/sessions/SessionsMap").then((m) => m.SessionsMap),
  { ssr: false, loading: () => <LoadingState message="Loading map…" /> },
);

const inputClassName =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

const defaultFilters: ParentSessionSearchFilters = {
  location: "",
  radius: "10",
  childAge: "",
  activity: "",
};

function getCustomerPrice(session: ClubSession): number {
  const feeSettings = getFeeSettings();
  return calculatePaymentBreakdown(
    session.price,
    session.platformFeePercent,
    feeSettings.feeHandling,
  ).customerPrice;
}

function getFromPriceLabel(session: ClubSession): string {
  const summary = getTicketPriceSummary(session);
  if (summary.includes("Free")) {
    return "Free";
  }

  const match = summary.match(/£[\d.]+/);
  if (match) {
    return `From ${match[0]}`;
  }

  return `From ${formatMoney(getCustomerPrice(session))}`;
}

function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
): ParentSessionSearchFilters {
  return {
    location: searchParams.get("location") ?? "",
    radius: searchParams.get("radius") ?? "10",
    childAge: searchParams.get("childAge") ?? "",
    activity: searchParams.get("activity") ?? "",
  };
}

export default function SessionsPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [filters, setFilters] = useState<ParentSessionSearchFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ParentSessionSearchFilters>(defaultFilters);
  const [searchCenter, setSearchCenter] = useState<SessionCoordinates | null>(
    null,
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const shouldShowMap = mapOpen || isLargeScreen;
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const initialFilters = parseFiltersFromSearchParams(
      new URLSearchParams(searchParams.toString()),
    );
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [searchParams]);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      setError(null);

      try {
        const result = await loadSessionsWithMeta();
        console.log(
          "[Activora /sessions] Supabase sessions loaded:",
          result.data.length,
        );
        setSessions(result.data);
        setError(result.error ?? null);
      } catch (loadError) {
        console.error("[Activora /sessions] Failed to load sessions", loadError);
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

  const geocodedSessions = useMemo(() => {
    const withCoordinates = sessions.filter((session) => {
      if (!hasValidSessionCoordinates(session)) {
        console.warn(
          "[Activora /sessions] Session missing coordinates:",
          session.id,
          session.sessionTitle,
          session.venue?.postcode ?? "no postcode",
        );
        return false;
      }

      return true;
    });

    console.log(
      "[Activora /sessions] Sessions with valid coordinates:",
      withCoordinates.length,
    );

    return withCoordinates;
  }, [sessions]);

  const results = useMemo(() => {
    const filtered = filterSessionsForParentPage(
      geocodedSessions,
      appliedFilters,
      searchCenter,
    );
    console.log(
      "[Activora /sessions] Sessions after search filter:",
      filtered.length,
    );
    return filtered;
  }, [geocodedSessions, appliedFilters, searchCenter]);

  const resultsLabel = useMemo(
    () => getParentSessionsResultsLabel(results.length, appliedFilters),
    [results.length, appliedFilters],
  );

  const handleSessionSelect = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setFocusSessionId(sessionId);
    cardRefs.current.get(sessionId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  }

  function handleCardFocus(sessionId: string) {
    setActiveSessionId(sessionId);
    setFocusSessionId(sessionId);
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
          <Logo size="desktop" href="/" />
          <a
            href="/parent/dashboard"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Parent Login
          </a>
        </nav>
      </header>

      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        {error ? (
          <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          </div>
        ) : null}
        {searchError ? (
          <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {searchError}
            </div>
          </div>
        ) : null}
        <form
          onSubmit={handleSearch}
          className="mx-auto grid max-w-[1400px] gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-[1.2fr_0.7fr_1fr_0.7fr_auto] sm:px-6"
        >
          <div>
            <label htmlFor="location" className="sr-only">
              Location or postcode
            </label>
            <input
              id="location"
              type="text"
              value={filters.location}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="Location or postcode"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="radius" className="sr-only">
              Radius
            </label>
            <select
              id="radius"
              value={filters.radius}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  radius: event.target.value,
                }))
              }
              className={inputClassName}
            >
              <option value="5">5 miles</option>
              <option value="10">10 miles</option>
              <option value="15">15 miles</option>
              <option value="25">25 miles</option>
            </select>
          </div>

          <div>
            <label htmlFor="activity" className="sr-only">
              Activity search
            </label>
            <input
              id="activity"
              type="text"
              value={filters.activity}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  activity: event.target.value,
                }))
              }
              placeholder="Search activity"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="child-age" className="sr-only">
              Child age
            </label>
            <input
              id="child-age"
              type="number"
              min={0}
              max={18}
              value={filters.childAge}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  childAge: event.target.value,
                }))
              }
              placeholder="Child age"
              className={inputClassName}
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 sm:col-span-2 xl:col-span-1"
          >
            Search
          </button>
        </form>
      </div>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 flex-1 flex-col border-zinc-200 lg:max-w-[55%] lg:border-r">
          <div className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                  Activities near you
                </h1>
                <p className="mt-1 text-sm font-medium text-zinc-600">
                  {loading ? "Loading sessions..." : resultsLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen((open) => !open)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 lg:hidden"
              >
                {mapOpen ? "Hide map" : "Show map"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:max-h-[calc(100vh-220px)]">
            {loading ? (
              <LoadingState message="Loading sessions..." />
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
                <h2 className="text-base font-semibold text-zinc-900">
                  No sessions match your search
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {appliedFilters.location.trim()
                    ? "Try a wider radius or different filters."
                    : "No activities are available yet. Check back soon or create a session from the club portal."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((session) => {
                  const { mainImageId, galleryImageIds } =
                    getSessionImages(session);
                  const distanceMiles = appliedFilters.location.trim()
                    ? getSessionDistanceMiles(
                        session,
                        appliedFilters.location,
                        searchCenter,
                      )
                    : null;
                  const distanceLabel =
                    distanceMiles !== null ? `${distanceMiles.toFixed(1)} mi` : null;

                  return (
                    <article
                      key={session.id}
                      ref={(element) => {
                        if (element) {
                          cardRefs.current.set(session.id, element);
                        }
                      }}
                      onMouseEnter={() => setActiveSessionId(session.id)}
                      onMouseLeave={() => setActiveSessionId(null)}
                      onClick={() => handleCardFocus(session.id)}
                      className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-shadow ${
                        activeSessionId === session.id
                          ? "border-pink-500 shadow-md ring-1 ring-pink-500"
                          : "border-zinc-200"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-4 sm:flex-1 sm:flex-row sm:items-start">
                          <SessionImageStrip
                            mainImageId={mainImageId}
                            galleryImageIds={galleryImageIds}
                            alt={session.sessionTitle}
                            className="h-28 w-full overflow-hidden rounded-xl border border-zinc-200 sm:h-32 sm:w-40"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-semibold text-zinc-900">
                                {session.sessionTitle}
                              </h2>
                              {distanceLabel ? (
                                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                                  {distanceLabel}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm font-medium text-zinc-700">
                              {session.venue?.venueName ||
                                formatSessionLocation(session)}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                              {[session.venue?.townCity, session.venue?.postcode]
                                .filter(Boolean)
                                .join(" ") || formatSessionLocation(session)}
                            </p>

                            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                              <div>
                                <dt className="text-zinc-500">Venue</dt>
                                <dd className="font-medium text-zinc-900">
                                  {session.venue?.venueName ||
                                    formatSessionLocation(session)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-zinc-500">Postcode</dt>
                                <dd className="font-medium text-zinc-900">
                                  {session.venue?.postcode || "—"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-zinc-500">Age range</dt>
                                <dd className="font-medium text-zinc-900">
                                  {session.ageRange}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-zinc-500">Day & time</dt>
                                <dd className="font-medium text-zinc-900">
                                  {formatDay(session.day)} ·{" "}
                                  {formatTimeRange(
                                    session.startTime,
                                    session.endTime,
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-zinc-500">Price</dt>
                                <dd className="font-medium text-zinc-900">
                                  {getFromPriceLabel(session)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>

                        <a
                          href={`/book/${session.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 sm:mt-1"
                        >
                          Book Now
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside
          className={`relative flex-1 bg-zinc-100 lg:min-h-[calc(100vh-180px)] lg:max-w-[45%] ${
            mapOpen ? "block min-h-[360px]" : "hidden lg:block"
          }`}
        >
          {shouldShowMap ? (
            <SessionsMap
              sessions={results}
              activeSessionId={activeSessionId}
              focusSessionId={focusSessionId}
              onSessionSelect={handleSessionSelect}
            />
          ) : (
            <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-zinc-500">
              Open the map to explore session locations.
            </div>
          )}
        </aside>
      </main>

      <PoweredByActivoraFooter />
    </div>
  );
}
