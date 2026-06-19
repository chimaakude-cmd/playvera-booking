"use client";

import type { ReactNode } from "react";
import { ActivityCategoryScrollRow } from "@/components/home/ActivityCategoryScrollRow";
import { buildSessionsUrl } from "@/lib/home/search-url";

type PopularCategoriesRowProps = {
  activeQuery: string;
  onSelect: (query: string) => void;
};

export function PopularCategoriesRow({
  activeQuery,
  onSelect,
}: PopularCategoriesRowProps) {
  return (
    <section
      id="discovery-popular-categories"
      className="border-b border-orange-100/60 bg-[#FFFBF7] py-4 sm:py-5"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <h2 className="mb-3 text-sm font-semibold text-[#0F172A] sm:text-base">
          Popular categories
        </h2>
        <div className="relative -mx-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#FFFBF7] to-transparent sm:w-8" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[#FFFBF7] to-transparent sm:w-8" />
          <ActivityCategoryScrollRow
            activeQuery={activeQuery}
            exploreAllHref={buildSessionsUrl({
              location: "",
              childAge: "",
              radius: "10",
              activity: "",
              date: "",
            })}
            exploreAllLabel="Explore all activities"
            renderCategory={(category, card: ReactNode) => (
              <button
                type="button"
                onClick={() => onSelect(category.query)}
                className="block h-full w-full text-left"
              >
                {card}
              </button>
            )}
          />
        </div>
      </div>
    </section>
  );
}
