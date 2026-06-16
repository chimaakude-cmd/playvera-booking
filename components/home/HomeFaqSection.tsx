"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FaqAccordion } from "@/components/help/FaqAccordion";
import { getHomepageFaqs } from "@/lib/help/faq-data";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_SECTION } from "./shared";

export function HomeFaqSection() {
  const { t } = useTranslation("homepage");
  const [query, setQuery] = useState("");
  const allItems = getHomepageFaqs().map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
  }));

  const items = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return allItems;
    }
    return allItems.filter(
      (item) =>
        item.question.toLowerCase().includes(trimmed) ||
        item.answer.toLowerCase().includes(trimmed),
    );
  }, [allItems, query]);

  return (
    <section
      aria-labelledby="home-faq-heading"
      className={`bg-white ${HOME_SECTION}`}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            id="home-faq-heading"
            className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl"
          >
            {t("faq.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {t("faq.subtitle")}
          </p>
        </div>

        <div className="relative mt-8">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("faq.searchPlaceholder")}
            className={`w-full border border-slate-200 bg-[#F8FAFC] py-3 pl-10 pr-4 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 ${HOME_BUTTON}`}
            aria-label={t("faq.searchPlaceholder")}
          />
        </div>

        <div className="mt-8">
          {items.length > 0 ? (
            <FaqAccordion items={items} />
          ) : (
            <p className="text-center text-sm text-slate-500">
              {t("faq.noResults")}
            </p>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/help/faq"
            className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${HOME_BUTTON}`}
            style={{ backgroundColor: ACTIVORA_ACTION }}
          >
            {t("faq.viewAll")}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
