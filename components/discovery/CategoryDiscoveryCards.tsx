"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  DISCOVERY_CATEGORY_CARDS,
  DISCOVERY_RADIUS,
} from "@/lib/discovery/constants";

type CategoryDiscoveryCardsProps = {
  activeQuery: string;
  onSelect: (query: string) => void;
};

function formatCount(count: number): string {
  return count.toLocaleString("en-GB");
}

export function CategoryDiscoveryCards({
  activeQuery,
  onSelect,
}: CategoryDiscoveryCardsProps) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none">
      {DISCOVERY_CATEGORY_CARDS.map((category) => {
        const isActive =
          activeQuery.toLowerCase() === category.query.toLowerCase();

        return (
          <button
            key={category.label}
            type="button"
            onClick={() => onSelect(category.query)}
            className={`discovery-category-card group relative shrink-0 overflow-hidden border text-left transition-all duration-200 ${DISCOVERY_RADIUS.category} ${
              isActive
                ? "border-[#2563EB] shadow-lg shadow-blue-200/60 ring-2 ring-blue-100"
                : "border-slate-200/80 shadow-sm hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
            } h-[120px] w-[170px] sm:h-[140px] sm:w-[220px]`}
          >
            <div className="absolute inset-0">
              <SafeImage
                src={category.image}
                alt=""
                fill
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="220px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#0F172A]/35 to-[#0F172A]/10" />
            </div>

            <div className="relative flex h-full flex-col justify-end p-3 sm:p-4">
              <span className="mb-1 text-lg sm:text-xl" aria-hidden>
                {category.icon}
              </span>
              <p className="text-sm font-bold leading-tight text-white sm:text-base">
                {category.label}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-white/80 sm:text-xs">
                {formatCount(category.count)} sessions
              </p>
            </div>
          </button>
        );
      })}

      <Link
        href="/sessions"
        className={`discovery-category-card inline-flex shrink-0 items-center justify-center border border-dashed border-slate-300 bg-white px-4 text-sm font-semibold text-[#2563EB] transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md ${DISCOVERY_RADIUS.category} h-[120px] w-[120px] sm:h-[140px] sm:w-[140px]`}
      >
        View all →
      </Link>
    </div>
  );
}
