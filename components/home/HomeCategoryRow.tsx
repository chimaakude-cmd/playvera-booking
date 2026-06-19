"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeActivityCategory } from "@/lib/home/category-images";
import { buildSessionsUrl, type HomeSearchFilters } from "@/lib/home/search-url";
import { useTranslation } from "@/lib/i18n";
import { ActivityCategoryScrollRow } from "./ActivityCategoryScrollRow";

type HomeCategoryRowProps = {
  filters: HomeSearchFilters;
};

export function HomeCategoryRow({ filters }: HomeCategoryRowProps) {
  const { t } = useTranslation("homepage");

  return (
    <section className="border-b border-slate-200/60 bg-[#F8FAFC] pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-6 text-lg font-bold text-[#0F172A] sm:mb-8 sm:text-xl">
          {t("categories.title")}
        </h2>

        <div className="relative -mx-4 sm:-mx-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#F8FAFC] to-transparent sm:w-8" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#F8FAFC] to-transparent sm:w-8" />
          <div className="px-4 sm:px-6">
            <ActivityCategoryScrollRow
              exploreAllHref={buildSessionsUrl(filters)}
              exploreAllLabel={t("categories.exploreAll")}
              renderCategory={(
                category: HomeActivityCategory,
                card: ReactNode,
              ) => (
                <Link
                  href={buildSessionsUrl(filters, category.query)}
                  className="block h-full w-full"
                >
                  {card}
                </Link>
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
