"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import {
  DISCOVERY_RADIUS,
  EMPTY_RECOMMENDATION_CARDS,
} from "@/lib/discovery/constants";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import { buildSessionsUrl } from "@/lib/home/search-url";
import Link from "next/link";

type EmptyRecommendationsProps = {
  filters: HomeSearchFilters;
  locationLabel?: string;
};

export function EmptyRecommendations({
  filters,
  locationLabel = "you",
}: EmptyRecommendationsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {EMPTY_RECOMMENDATION_CARDS.map((card) => {
        const title =
          card.id === "popular-near-you"
            ? `Popular near ${locationLabel}`
            : card.id === "similar-age" && filters.childAge.trim()
              ? `Ages ${filters.childAge} and similar`
              : card.title;

        return (
          <Link
            key={card.id}
            href={buildSessionsUrl({ ...filters, activity: card.query })}
            className={`discovery-empty-recommendation group relative overflow-hidden bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/60 ${DISCOVERY_RADIUS.card}`}
          >
            <div className="relative aspect-[16/9] w-full">
              <SafeImage
                src={card.image}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/35 to-[#0F172A]/10" />
              <span
                className="absolute left-4 top-4 text-2xl"
                aria-hidden
              >
                {card.icon}
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#F87128] sm:text-lg">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {card.description}
              </p>
              <span className="mt-3 inline-block text-xs font-semibold text-[#F87128]">
                Browse activities →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
