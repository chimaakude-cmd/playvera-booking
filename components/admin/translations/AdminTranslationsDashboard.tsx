"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import {
  FUTURE_LOCALES,
  getAllLocaleCompletions,
  getLocaleSettings,
  setLocaleSettings,
  SUPPORTED_LOCALES,
  type LocaleCode,
  type LocaleCompletion,
  type LocaleSettings,
} from "@/lib/i18n";

function CompletionBar({ percent }: { percent: number }) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
      <div
        className={`h-full rounded-full transition-all ${
          percent >= 95
            ? "bg-emerald-500"
            : percent >= 60
              ? "bg-amber-500"
              : "bg-rose-400"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function AdminTranslationsDashboard() {
  const [settings, setSettings] = useState<LocaleSettings>(() =>
    getLocaleSettings(),
  );
  const completions = useMemo(() => getAllLocaleCompletions(), []);
  const [expandedLocale, setExpandedLocale] = useState<LocaleCode | null>(null);

  useEffect(() => {
    setLocaleSettings(settings);
  }, [settings]);

  function toggleLocale(code: LocaleCode, enabled: boolean) {
    if (code === "en") {
      return;
    }
    setSettings((current) => ({
      ...current,
      [code]: { enabled },
    }));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Translations"
        description="Manage UK language availability and track UI translation coverage across Activora."
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">
          Language availability
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Published languages appear in the language selector. English is always
          enabled.
        </p>

        <div className="mt-5 divide-y divide-zinc-100">
          {SUPPORTED_LOCALES.map((locale) => {
            const completion = completions.find(
              (item) => item.locale === locale.code,
            );
            const enabled = settings[locale.code]?.enabled ?? false;

            return (
              <div
                key={locale.code}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {locale.nativeLabel}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      ({locale.label})
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">{locale.region}</p>
                  {completion ? (
                    <p className="mt-1 text-xs font-medium text-zinc-600">
                      {completion.percent}% complete · {completion.translatedKeys}/
                      {completion.totalKeys} keys
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      100% · source language
                    </p>
                  )}
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={locale.code === "en" ? true : enabled}
                    disabled={locale.code === "en"}
                    onChange={(event) =>
                      toggleLocale(locale.code, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 disabled:opacity-60"
                  />
                  {locale.code === "en" ? "Always published" : "Published"}
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">
          Coverage by language
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {completions.map((item) => (
            <LocaleCompletionCard
              key={item.locale}
              item={item}
              expanded={expandedLocale === item.locale}
              onToggle={() =>
                setExpandedLocale((current) =>
                  current === item.locale ? null : item.locale,
                )
              }
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6">
        <h2 className="text-base font-semibold text-zinc-900">Future locales</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Planned languages — disabled until translation files are added.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {FUTURE_LOCALES.map((locale) => (
            <li
              key={locale.code}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600"
            >
              {locale.nativeLabel} · disabled
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function LocaleCompletionCard({
  item,
  expanded,
  onToggle,
}: {
  item: LocaleCompletion;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-900">{item.nativeLabel}</h3>
          <p className="text-sm text-zinc-500">
            {item.translatedKeys} of {item.totalKeys} strings translated
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 shadow-sm">
          {item.percent}%
        </span>
      </div>
      <CompletionBar percent={item.percent} />

      <div className="mt-4 space-y-2">
        {item.namespaces.map((namespace) => (
          <div
            key={namespace.namespace}
            className="flex items-center justify-between text-xs text-zinc-600"
          >
            <span className="font-medium capitalize">{namespace.namespace}</span>
            <span>
              {namespace.translatedKeys}/{namespace.totalKeys} ({namespace.percent}
              %)
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="mt-4 text-xs font-semibold text-violet-700 hover:text-violet-900"
      >
        {expanded ? "Hide missing strings" : `Show missing (${item.missingKeys.length})`}
      </button>

      {expanded ? (
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
          {item.missingKeys.length === 0 ? (
            <li className="text-emerald-700">All strings translated.</li>
          ) : (
            item.missingKeys.map((key) => <li key={key}>{key}</li>)
          )}
        </ul>
      ) : null}
    </article>
  );
}
