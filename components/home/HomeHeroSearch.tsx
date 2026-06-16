"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ACTIVORA_ACTION,
  ACTIVORA_ACCENT,
  ACTIVITY_SUGGESTIONS,
  HERO_CAROUSEL,
} from "@/lib/home/constants";
import {
  buildSessionsUrl,
  type HomeSearchFilters,
} from "@/lib/home/search-url";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_CARD } from "./shared";

type HomeHeroSearchProps = {
  filters: HomeSearchFilters;
  onFiltersChange: (updates: Partial<HomeSearchFilters>) => void;
};

const INPUT_CLASS = `w-full ${HOME_BUTTON} border border-slate-200 px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100`;

export function HomeHeroSearch({ filters, onFiltersChange }: HomeHeroSearchProps) {
  const { t } = useTranslation("homepage");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
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
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = buildSessionsUrl(filters);
  }

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

  const filteredSuggestions = ACTIVITY_SUGGESTIONS.filter((item) =>
    item.label.toLowerCase().includes(filters.activity.toLowerCase()),
  );

  return (
    <section
      id="hero-search"
      className="bg-[#F8FAFC] pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-24"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div>
          <h1 className="max-w-xl text-[2rem] font-extrabold leading-[1.12] tracking-tight text-[#0F172A] sm:text-5xl lg:text-[2.75rem]">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
            {t("hero.subtitle")}
          </p>

          <form
            onSubmit={handleSearch}
            className={`mt-8 border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6 ${HOME_CARD}`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="home-location"
                  className="mb-1.5 block text-sm font-semibold text-[#0F172A]"
                >
                  {t("hero.location")}
                </label>
                <input
                  id="home-location"
                  type="text"
                  value={filters.location}
                  onChange={(event) =>
                    onFiltersChange({ location: event.target.value })
                  }
                  placeholder={t("hero.locationPlaceholder")}
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="mt-1.5 text-xs font-semibold hover:underline disabled:opacity-60"
                  style={{ color: ACTIVORA_ACTION }}
                >
                  {locating ? t("hero.locating") : t("hero.useLocation")}
                </button>
              </div>

              <div>
                <label
                  htmlFor="home-child-age"
                  className="mb-1.5 block text-sm font-semibold text-[#0F172A]"
                >
                  {t("hero.childAge")}
                </label>
                <select
                  id="home-child-age"
                  value={filters.childAge}
                  onChange={(event) =>
                    onFiltersChange({ childAge: event.target.value })
                  }
                  className={`${INPUT_CLASS} bg-white`}
                >
                  <option>4 - 12 years</option>
                  <option>3 - 5 years</option>
                  <option>6 - 8 years</option>
                  <option>9 - 12 years</option>
                  <option>13+ years</option>
                </select>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-semibold text-[#0F172A]">
                  {t("hero.radius")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["5", "10", "15", "25"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onFiltersChange({ radius: value })}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                        filters.radius === value
                          ? "text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                      style={
                        filters.radius === value
                          ? { backgroundColor: ACTIVORA_ACTION }
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
                  className="mb-1.5 block text-sm font-semibold text-[#0F172A]"
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
                  <div className={`absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden border border-slate-200 bg-white shadow-xl ${HOME_CARD}`}>
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
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                    <Link
                      href={buildSessionsUrl(filters)}
                      className="block border-t border-slate-100 px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                      style={{ color: ACTIVORA_ACTION }}
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
                  className="mb-1.5 block text-sm font-semibold text-[#0F172A]"
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
              className={`mt-5 flex w-full items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] ${HOME_BUTTON}`}
              style={{
                backgroundColor: ACTIVORA_ACTION,
                boxShadow: `0 10px 28px ${ACTIVORA_ACTION}35`,
              }}
            >
              {t("hero.searchActivities")}
            </button>
          </form>

          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
            <span className="text-amber-400">★★★★★</span>
            {t("hero.trustedBy")}
          </p>
        </div>

        <div className="relative hidden lg:block">
          <div className={`relative aspect-[4/3] overflow-hidden shadow-xl shadow-slate-900/10 ${HOME_CARD}`}>
            {HERO_CAROUSEL.map((slide, index) => (
              <div
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-700 ${
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 via-transparent to-transparent" />
                <p className="absolute bottom-5 left-5 text-lg font-bold text-white">
                  {slide.title}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {HERO_CAROUSEL.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === activeSlide ? "w-6" : "w-2 bg-slate-300"
                }`}
                style={
                  index === activeSlide
                    ? { backgroundColor: ACTIVORA_ACCENT }
                    : undefined
                }
                aria-label={slide.title}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
