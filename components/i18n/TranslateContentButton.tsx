"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type TranslateContentButtonProps = {
  content: string;
  className?: string;
};

export function TranslateContentButton({
  content,
  className = "",
}: TranslateContentButtonProps) {
  const { t } = useTranslation("common");
  const [toast, setToast] = useState<string | null>(null);

  function handleClick() {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(content);
      setToast(t("translate.copiedOriginal"));
    } else {
      setToast(t("translate.comingSoon"));
    }

    window.setTimeout(() => setToast(null), 3000);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-teal-300 hover:text-teal-700 ${className}`}
        aria-label={t("buttons.translate")}
      >
        <Languages className="h-3.5 w-3.5" aria-hidden />
        {t("buttons.translate")}
      </button>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[110] -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
