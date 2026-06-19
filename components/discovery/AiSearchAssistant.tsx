"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import {
  ACTIVORA_ACTION,
  ACTIVORA_ACCENT,
} from "@/lib/home/constants";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import {
  aiFiltersToHomeSearchFilters,
  type AiSearchFilterFields,
} from "@/lib/ai/search-assistant";

type AiSearchAssistantProps = {
  onApplyFilters: (updates: Partial<HomeSearchFilters>) => void;
};

type AiSearchApiResponse = {
  filters?: AiSearchFilterFields;
  followUpQuestion?: string;
  error?: string;
};

const PLACEHOLDER =
  'Try: "Swimming for my 6-year-old near Manchester this Saturday under £15"';

export function AiSearchAssistant({ onApplyFilters }: AiSearchAssistantProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setFollowUpQuestion(null);
    setParsedSummary(null);

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      const payload = (await response.json()) as AiSearchApiResponse;

      if (!response.ok) {
        setError(payload.error ?? "Could not understand that search.");
        return;
      }

      const parsedFilters = payload.filters ?? {};
      const updates = aiFiltersToHomeSearchFilters(parsedFilters);

      if (Object.keys(updates).length === 0 && !payload.followUpQuestion) {
        setFollowUpQuestion(
          "What activity are you looking for, and which area should we search?",
        );
        return;
      }

      if (Object.keys(updates).length > 0) {
        setParsedSummary(describeParsedFilters(parsedFilters, updates));
        onApplyFilters(updates);
      }

      if (payload.followUpQuestion) {
        setFollowUpQuestion(payload.followUpQuestion);
      }
    } catch {
      setError("Something went wrong. Try again or use the filters above.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`my-3 flex w-full items-center justify-between gap-3 border border-blue-100 bg-blue-50/70 px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50 ${DISCOVERY_RADIUS.button}`}
          aria-expanded={open}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <Sparkles className="h-4 w-4 text-[#2563EB]" aria-hidden />
            AI Search Assistant
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
            Describe what you need in plain English
            {open ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </span>
        </button>

        {open ? (
          <div className={`mb-4 border border-slate-200 bg-white p-4 shadow-sm ${DISCOVERY_RADIUS.card}`}>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
              <label htmlFor="ai-search-query" className="sr-only">
                AI search query
              </label>
              <textarea
                id="ai-search-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={PLACEHOLDER}
                rows={3}
                className={`w-full resize-none border border-slate-200 px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 ${DISCOVERY_RADIUS.input}`}
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className={`inline-flex items-center px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${DISCOVERY_RADIUS.button}`}
                  style={{ backgroundColor: ACTIVORA_ACTION }}
                >
                  {loading ? "Understanding…" : "Apply to search filters"}
                </button>
                <p className="text-xs text-slate-500">
                  Updates the filters above — search only, no bookings or admin actions.
                </p>
              </div>
            </form>

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            ) : null}

            {parsedSummary ? (
              <p className="mt-3 text-sm text-slate-700">
                Applied: {parsedSummary}
              </p>
            ) : null}

            {followUpQuestion ? (
              <div
                className={`mt-3 border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ${DISCOVERY_RADIUS.button}`}
                role="status"
              >
                {followUpQuestion}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function describeParsedFilters(
  raw: AiSearchFilterFields,
  applied: Partial<HomeSearchFilters>,
): string {
  const parts: string[] = [];

  if (applied.activity) {
    parts.push(`activity "${applied.activity}"`);
  }
  if (applied.location) {
    parts.push(`near ${applied.location}`);
  }
  if (applied.childAge) {
    parts.push(`age ${applied.childAge}`);
  }
  if (applied.radius) {
    parts.push(`${applied.radius} mile radius`);
  }
  if (applied.date) {
    parts.push(`date ${applied.date}`);
  }
  if (raw.priceMax !== undefined) {
    parts.push(`under £${raw.priceMax}`);
  }
  if (raw.priceMin !== undefined && raw.priceMax === undefined) {
    parts.push(`from £${raw.priceMin}`);
  }

  return parts.length > 0 ? parts.join(", ") : "your request";
}
