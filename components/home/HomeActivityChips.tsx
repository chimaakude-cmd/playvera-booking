"use client";

import Link from "next/link";
import { ACTIVITY_CHIPS } from "@/lib/home/constants";
import { buildSessionsUrl, type HomeSearchFilters } from "@/lib/home/search-url";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON } from "./shared";

type HomeActivityChipsProps = {
  filters: HomeSearchFilters;
};

export function HomeActivityChips({ filters }: HomeActivityChipsProps) {
  const { t } = useTranslation("homepage");

  return (
    <section className="border-b border-slate-200/60 bg-[#F8FAFC] pb-12 pt-4 sm:pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-4 text-sm font-semibold text-slate-500">
          {t("chips.title")}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {ACTIVITY_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={buildSessionsUrl(filters, chip.query)}
              className={`inline-flex shrink-0 items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition-all hover:border-blue-200 hover:shadow-md ${HOME_BUTTON}`}
            >
              <span aria-hidden>{chip.icon}</span>
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
