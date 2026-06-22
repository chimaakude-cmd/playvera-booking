"use client";

import { useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import { HELP_ARTICLES, searchArticles } from "@/lib/support/articles";

export function KnowledgeBasePage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const articles = searchArticles(query);
  const selected = selectedId
    ? HELP_ARTICLES.find((article) => article.id === selectedId)
    : null;

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Support"
          title="Knowledge base"
          subtitle="Search guides for providers and parents — bookings, payments, sessions and more."
        />

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {selected ? (
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900/40 sm:p-8">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-400"
              >
                ← All articles
              </button>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {selected.category}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {selected.title}
              </h2>
              <p className="mt-6 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                {selected.body}
              </p>
            </article>
          ) : (
            <>
              <label htmlFor="kb-search" className="sr-only">
                Search knowledge base
              </label>
              <input
                id="kb-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search articles…"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-teal-900"
              />

              <ul className="mt-6 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                {articles.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-zinc-500">
                    No articles match your search. Try different keywords or{" "}
                    <a href="/contact" className="font-semibold text-teal-700 dark:text-teal-400">
                      contact support
                    </a>
                    .
                  </li>
                ) : (
                  articles.map((article) => (
                    <li key={article.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(article.id)}
                        className="w-full px-4 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                          {article.category}
                        </p>
                        <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                          {article.title}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {article.summary}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
