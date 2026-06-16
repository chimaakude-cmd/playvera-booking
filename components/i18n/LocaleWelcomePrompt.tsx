"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import {
  dismissWelcomePrompt,
  getStoredLocale,
  getLocaleMeta,
  getWelcomePromptLocale,
  isWelcomeDismissed,
  useI18n,
  useTranslation,
  type LocaleCode,
} from "@/lib/i18n";

export function LocaleWelcomePrompt() {
  const { locale, setLocale, ready } = useI18n();
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");
  const [suggested, setSuggested] = useState<LocaleCode | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready || isWelcomeDismissed() || getStoredLocale()) {
      return;
    }

    const detected = getWelcomePromptLocale();
    if (detected && locale === "en") {
      setSuggested(detected);
      setVisible(true);
    }
  }, [ready, locale]);

  function handleKeepEnglish() {
    dismissWelcomePrompt();
    setVisible(false);
  }

  function handleSwitch() {
    if (suggested) {
      setLocale(suggested);
    }
    dismissWelcomePrompt();
    setVisible(false);
  }

  if (!visible || !suggested) {
    return null;
  }

  const meta = getLocaleMeta(suggested);

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("welcome.prompt", { language: meta.nativeLabel })}
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-md animate-[fadeIn_0.3s_ease-out] sm:left-auto sm:right-6"
    >
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-900/10">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Globe className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">
              {t("welcome.prompt", { language: meta.nativeLabel })}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {t("welcome.promptDescription")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSwitch}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500"
              >
                {tc("buttons.switch")}
              </button>
              <button
                type="button"
                onClick={handleKeepEnglish}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                {tc("buttons.keepEnglish")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
