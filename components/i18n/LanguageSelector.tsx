"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Globe, X } from "lucide-react";
import {
  getEnabledLocales,
  getLocaleMeta,
  SUPPORTED_LOCALES,
  useI18n,
  useTranslation,
  type LocaleCode,
} from "@/lib/i18n";

type LanguageSelectorProps = {
  variant?: "header" | "footer" | "settings";
  className?: string;
};

function LocaleOption({
  code,
  active,
  onSelect,
}: {
  code: LocaleCode;
  active: boolean;
  onSelect: (code: LocaleCode) => void;
}) {
  const meta = getLocaleMeta(code);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={() => onSelect(code)}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
        active
          ? "bg-teal-50 font-semibold text-teal-800"
          : "text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      <span>
        {meta.nativeLabel}
        <span className="ml-1.5 text-xs font-normal text-zinc-500">
          ({meta.label})
        </span>
      </span>
      {active ? (
        <span className="text-xs font-semibold text-teal-600" aria-hidden>
          ✓
        </span>
      ) : null}
    </button>
  );
}

export function LanguageSelector({
  variant = "header",
  className = "",
}: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const { t } = useTranslation("common");
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const enabledLocales = getEnabledLocales();
  const options = SUPPORTED_LOCALES.filter((item) =>
    enabledLocales.includes(item.code),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!sheetOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  function handleSelect(code: LocaleCode) {
    setLocale(code);
    setOpen(false);
    setSheetOpen(false);
  }

  const triggerClass =
    variant === "footer"
      ? "inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:border-teal-400/40 hover:bg-white/10"
      : variant === "settings"
        ? "inline-flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800"
        : "inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

  return (
    <>
      {/* Desktop dropdown */}
      <div ref={containerRef} className={`relative hidden sm:block ${className}`}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={t("language.selectorAria")}
          onClick={() => setOpen((value) => !value)}
          className={triggerClass}
        >
          <Globe className="h-4 w-4" aria-hidden />
          <span>{t("language.label")}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label={t("language.selectLabel")}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl"
          >
            {options.map((item) => (
              <LocaleOption
                key={item.code}
                code={item.code}
                active={locale === item.code}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Mobile bottom sheet trigger */}
      <div className={`sm:hidden ${className}`}>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={t("language.selectorAria")}
          onClick={() => setSheetOpen(true)}
          className={triggerClass}
        >
          <Globe className="h-4 w-4" aria-hidden />
          <span>{t("language.label")}</span>
        </button>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[100] sm:hidden" role="presentation">
          <button
            type="button"
            aria-label={t("buttons.close")}
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("language.selectLabel")}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                {t("language.selectLabel")}
              </h2>
              <button
                type="button"
                aria-label={t("buttons.close")}
                onClick={() => setSheetOpen(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div role="listbox" className="space-y-1">
              {options.map((item) => (
                <LocaleOption
                  key={item.code}
                  code={item.code}
                  active={locale === item.code}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
