"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import {
  DISCOVERY_RADIUS,
  POPULAR_CATEGORIES,
} from "@/lib/discovery/constants";

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
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none">
            {POPULAR_CATEGORIES.map((category) => {
              const isActive =
                activeQuery.toLowerCase() === category.query.toLowerCase();

              if (category.image) {
                return (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => onSelect(category.query)}
                    className={`discovery-category-card group relative shrink-0 overflow-hidden text-left transition-all duration-200 ${DISCOVERY_RADIUS.category} ${
                      isActive
                        ? "ring-2 ring-[#F87128]/40 shadow-lg shadow-orange-100/80"
                        : "shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-100/50"
                    } h-[100px] w-[140px] sm:h-[112px] sm:w-[168px]`}
                  >
                    <div className="absolute inset-0">
                      <SafeImage
                        src={category.image}
                        alt=""
                        fill
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="168px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/25 to-transparent" />
                    </div>
                    <div className="relative flex h-full flex-col justify-end p-3">
                      <span className="mb-0.5 text-base" aria-hidden>
                        {category.icon}
                      </span>
                      <p className="text-xs font-bold leading-tight text-white sm:text-sm">
                        {category.label}
                      </p>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => onSelect(category.query)}
                  className={`discovery-category-chip inline-flex shrink-0 items-center gap-2 border bg-white px-4 py-3 text-xs font-semibold transition-all duration-200 sm:text-sm ${DISCOVERY_RADIUS.button} ${
                    isActive
                      ? "border-[#F87128] text-[#F87128] shadow-sm shadow-orange-100/60"
                      : "border-orange-100/80 text-[#0F172A] hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <span aria-hidden>{category.icon}</span>
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
