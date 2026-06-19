"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Headphones,
  Loader2,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  ACTIVORA_ACCENT,
  ACTIVORA_ACTION,
  ACTIVORA_GRADIENT,
  ACTIVITY_SUGGESTIONS,
  HERO_CAROUSEL,
  HERO_TRUST_SIGNALS,
} from "@/lib/home/constants";
import {
  buildSessionsUrl,
  type HomeSearchFilters,
} from "@/lib/home/search-url";
import { useTranslation } from "@/lib/i18n";
import {
  NEARBY_SEARCH_RADIUS,
  requestUserLocation,
  reverseGeocodeUk,
} from "@/lib/home/use-my-location";
import { HOME_BUTTON, HOME_CARD, HOME_SHADOW, HOME_SHADOW_LG } from "./shared";

type HomeHeroSearchProps = {
  filters: HomeSearchFilters;
  onFiltersChange: (updates: Partial<HomeSearchFilters>) => void;
};

const INPUT_CLASS = `w-full ${HOME_BUTTON} border border-slate-200/90 bg-slate-50/50 px-4 py-3 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100`;

const TRUST_ICONS = {
  badge: BadgeCheck,
  shield: ShieldCheck,
  refund: RotateCcw,
  support: Headphones,
} as const;

function HeroCarousel({
  activeSlide,
  onSelectSlide,
}: {
  activeSlide: number;
  onSelectSlide: (index: number) => void;
}) {
  return (
    <div className="relative">
      <div
        className={`relative aspect-[4/3] overflow-hidden border border-slate-200/60 bg-white ${HOME_CARD} ${HOME_SHADOW_LG}`}
      >
        {HERO_CAROUSEL.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover"
              fetchPriority={index === 0 ? "high" : undefined}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-[#0F172A]/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <span
                className="mb-2 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                style={{ background: ACTIVORA_GRADIENT }}
              >
                Popular
              </span>
              <p className="text-xl font-bold text-white sm:text-2xl">
                {slide.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {HERO_CAROUSEL.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => onSelectSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeSlide ? "w-7" : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
            style={
              index === activeSlide
                ? { background: ACTIVORA_GRADIENT }
                : undefined
            }
            aria-label={slide.title}
            aria-current={index === activeSlide ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function HomeHeroSearch({ filters, onFiltersChange }: HomeHeroSearchProps) {
  const { t } = useTranslation("homepage");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_CAROUSEL.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = buildSessionsUrl(filters);
  }

  async function handleUseLocation() {
    setLocationError(null);
    setLocating(true);

    try {
      const position = await requestUserLocation();
      const { label } = await reverseGeocodeUk(
        position.coords.latitude,
        position.coords.longitude,
      );
      onFiltersChange({
        location: `${label} ✓`,
        radius: NEARBY_SEARCH_RADIUS,
      });
    } catch {
      setLocationError(t("hero.locationUnavailable"));
    } finally {
      setLocating(false);
    }
  }

  const filteredSuggestions = ACTIVITY_SUGGESTIONS.filter((item) =>
    item.label.toLowerCase().includes(filters.activity.toLowerCase()),
  );

  return (
    <section
      id="hero-search"
      className="bg-[#F8FAFC] pb-20 pt-10 sm:pb-28 sm:pt-12 lg:pb-32 lg:pt-14"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <h1 className="max-w-xl text-[2rem] font-extrabold leading-[1.1] tracking-tight text-[#0F172A] sm:text-[2.75rem] lg:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <form
            onSubmit={handleSearch}
            className={`mt-8 border border-slate-200/80 bg-white p-6 sm:mt-10 sm:p-8 ${HOME_CARD} ${HOME_SHADOW}`}
          >
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              <div>
                <label
                  htmlFor="home-location"
                  className="mb-2 block text-sm font-semibold text-[#0F172A]"
                >
                  {t("hero.location")}
                </label>
                <div className="relative">
                  <input
                    id="home-location"
                    type="text"
                    value={filters.location}
                    onChange={(event) => {
                      setLocationError(null);
                      onFiltersChange({ location: event.target.value });
                    }}
                    placeholder={t("hero.locationPlaceholder")}
                    className={`${INPUT_CLASS} pr-11`}
                    aria-describedby={
                      locationError ? "home-location-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={locating}
                    className={`absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#F87128] disabled:opacity-60 ${HOME_BUTTON}`}
                    aria-label={t("hero.useLocationAria")}
                    title={t("hero.useLocation")}
                  >
                    {locating ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        style={{ color: ACTIVORA_ACTION }}
                        aria-hidden
                      />
                    ) : (
                      <MapPin className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
                {locationError ? (
                  <p
                    id="home-location-error"
                    className="mt-1.5 text-xs font-medium text-amber-700"
                    role="status"
                  >
                    {locationError}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="home-child-age"
                  className="mb-2 block text-sm font-semibold text-[#0F172A]"
                >
                  {t("hero.childAge")}
                </label>
                <select
                  id="home-child-age"
                  value={filters.childAge}
                  onChange={(event) =>
                    onFiltersChange({ childAge: event.target.value })
                  }
                  className={`${INPUT_CLASS} bg-slate-50/50`}
                >
                  <option>4 - 12 years</option>
                  <option>3 - 5 years</option>
                  <option>6 - 8 years</option>
                  <option>9 - 12 years</option>
                  <option>13+ years</option>
                </select>
              </div>

              <div>
                <span className="mb-2 block text-sm font-semibold text-[#0F172A]">
                  {t("hero.radius")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {["5", "10", "15", "25"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onFiltersChange({ radius: value })}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
                        filters.radius === value
                          ? "text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-[#0F172A]"
                      }`}
                      style={
                        filters.radius === value
                          ? { background: ACTIVORA_GRADIENT }
                          : undefined
                      }
                    >
                      {t("hero.radiusMiles", { value })}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={suggestionsRef} className="relative">
                <label
                  htmlFor="home-activity"
                  className="mb-2 block text-sm font-semibold text-[#0F172A]"
                >
                  {t("hero.activity")}
                </label>
                <input
                  id="home-activity"
                  type="text"
                  value={filters.activity}
                  onChange={(event) =>
                    onFiltersChange({ activity: event.target.value })
                  }
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t("hero.activityPlaceholder")}
                  className={INPUT_CLASS}
                />

                {showSuggestions ? (
                  <div
                    className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden border border-slate-200 bg-white ${HOME_CARD} ${HOME_SHADOW}`}
                  >
                    {(filteredSuggestions.length > 0
                      ? filteredSuggestions
                      : ACTIVITY_SUGGESTIONS
                    ).map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          onFiltersChange({ activity: item.label });
                          setShowSuggestions(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50/60"
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                    <Link
                      href={buildSessionsUrl(filters)}
                      className="block border-t border-slate-100 px-4 py-3 text-sm font-semibold transition-colors hover:bg-violet-50/60"
                      style={{ color: ACTIVORA_ACCENT }}
                      onClick={() => setShowSuggestions(false)}
                    >
                      {t("hero.seeAllResults")}
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="home-date"
                  className="mb-2 block text-sm font-semibold text-[#0F172A]"
                >
                  {t("hero.date")}
                </label>
                <input
                  id="home-date"
                  type="date"
                  value={filters.date}
                  onChange={(event) =>
                    onFiltersChange({ date: event.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`mt-6 flex w-full items-center justify-center gap-2 px-6 py-4 text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] sm:mt-7 ${HOME_BUTTON}`}
              style={{
                background: ACTIVORA_GRADIENT,
                boxShadow: "0 12px 32px rgba(147, 51, 234, 0.25)",
              }}
            >
              {t("hero.searchActivities")}
            </button>
          </form>

          <ul className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:gap-4">
            {HERO_TRUST_SIGNALS.map(({ key, icon }) => {
              const Icon = TRUST_ICONS[icon];
              return (
                <li
                  key={key}
                  className={`flex items-center gap-2.5 border border-slate-200/70 bg-white px-3.5 py-2.5 sm:px-4 ${HOME_BUTTON} ${HOME_SHADOW}`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: ACTIVORA_GRADIENT }}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold text-[#0F172A] sm:text-sm">
                    {t(`hero.trustSignals.${key}`)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden md:block">
          <HeroCarousel
            activeSlide={activeSlide}
            onSelectSlide={setActiveSlide}
          />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl px-4 sm:mt-12 sm:px-6 md:hidden">
        <HeroCarousel activeSlide={activeSlide} onSelectSlide={setActiveSlide} />
      </div>
    </section>
  );
}
