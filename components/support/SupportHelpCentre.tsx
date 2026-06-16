"use client";

import { useState } from "react";
import { HELP_ARTICLES, searchArticles } from "@/lib/support/articles";

export function SupportHelpCentre() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const articles = searchArticles(query);
  const selected = selectedId
    ? HELP_ARTICLES.find((a) => a.id === selectedId)
    : null;

  if (selected) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-zinc-100 px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900"
          >
            ← All articles
          </button>
          <h3 className="mt-2 text-sm font-semibold text-zinc-900">
            {selected.title}
          </h3>
          <p className="text-xs text-zinc-500">{selected.category}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-sm leading-relaxed text-zinc-700">{selected.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-100 px-4 py-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
        />
      </div>
      <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto">
        {articles.map((article) => (
          <li key={article.id}>
            <button
              type="button"
              onClick={() => setSelectedId(article.id)}
              className="w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-zinc-50"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                {article.category}
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                {article.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {article.summary}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
