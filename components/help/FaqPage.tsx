"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bug,
  CalendarDays,
  MessageCircle,
  Search,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { FaqAccordion } from "@/components/help/FaqAccordion";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import {
  FAQ_CATEGORIES,
  filterFaqs,
  getCategoryLabel,
  type FaqCategoryId,
} from "@/lib/help/faq-data";
import { openSupportDrawer } from "@/lib/inbox/storage";

type CategoryFilter = FaqCategoryId | "all";

function EmptyStateCards() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => openSupportDrawer({ newChat: true })}
        className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
      >
        <MessageCircle
          className="h-6 w-6 text-teal-600 transition-colors group-hover:text-teal-500"
          aria-hidden
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-teal-700">
          Chat support
        </p>
        <p className="mt-1 text-sm text-zinc-600">Open support chat</p>
      </button>

      <Link
        href="/#book-demo"
        className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
      >
        <CalendarDays
          className="h-6 w-6 text-teal-600 transition-colors group-hover:text-teal-500"
          aria-hidden
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-teal-700">
          Book a demo
        </p>
        <p className="mt-1 text-sm text-zinc-600">Book a walkthrough</p>
      </Link>

      <Link
        href="/report-bug"
        className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
      >
        <Bug
          className="h-6 w-6 text-teal-600 transition-colors group-hover:text-teal-500"
          aria-hidden
        />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-teal-700">
          Report a bug
        </p>
        <p className="mt-1 text-sm text-zinc-600">Submit a bug report</p>
      </Link>
    </div>
  );
}

export function FaqPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const filteredItems = useMemo(
    () => filterFaqs(query, category),
    [query, category],
  );

  const groupedItems = useMemo(() => {
    if (category !== "all") {
      return [{ categoryId: category, items: filteredItems }];
    }

    return FAQ_CATEGORIES.map((entry) => ({
      categoryId: entry.id,
      items: filteredItems.filter((item) => item.category === entry.id),
    })).filter((group) => group.items.length > 0);
  }, [category, filteredItems]);

  const accordionItems = filteredItems.map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
  }));

  const showEmptyState = filteredItems.length === 0;
  const showGroupedView = category === "all" && !query.trim();

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1">
        <section className="border-b border-zinc-100 bg-gradient-to-b from-teal-50/60 to-white">
          <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Help Centre
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              Search questions, learn how Activora works, or speak with our team.
            </p>

            <label className="relative mx-auto mt-8 block max-w-xl">
              <span className="sr-only">Search FAQs</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a question…"
                className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-12 pr-4 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="FAQ categories"
          >
            <button
              type="button"
              role="tab"
              aria-selected={category === "all"}
              onClick={() => setCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === "all"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              All
            </button>
            {FAQ_CATEGORIES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={category === entry.id}
                onClick={() => setCategory(entry.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === entry.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {showEmptyState ? (
            <div className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-zinc-900">
                Can&apos;t find your answer?
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Try a different search term or reach out to our team directly.
              </p>
              <EmptyStateCards />
            </div>
          ) : showGroupedView ? (
            <div className="mt-8 space-y-10">
              {groupedItems.map((group) => (
                <div key={group.categoryId}>
                  <h2 className="mb-4 text-lg font-bold text-zinc-900">
                    {getCategoryLabel(group.categoryId)}
                  </h2>
                  <FaqAccordion
                    items={group.items.map((item) => ({
                      id: item.id,
                      question: item.question,
                      answer: item.answer,
                    }))}
                    allowMultiple
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <FaqAccordion items={accordionItems} allowMultiple />
            </div>
          )}
        </section>

        <section className="border-t border-zinc-100 bg-zinc-50/80">
          <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-14">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              Still stuck?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 sm:text-base">
              Our team is here to help.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openSupportDrawer({ newChat: true })}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition-all hover:bg-teal-500"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Chat with support
              </button>
              <Link
                href="/#book-demo"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:border-teal-300 hover:bg-teal-50"
              >
                <CalendarDays className="h-4 w-4 text-teal-600" aria-hidden />
                Book a demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
