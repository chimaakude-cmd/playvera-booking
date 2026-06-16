"use client";

import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useTranslation } from "@/lib/i18n";

export function LanguageSettingsSection() {
  const { t } = useTranslation("dashboard");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">
        {t("settings.languageTitle")}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {t("settings.languageDescription")}
      </p>
      <div className="mt-4 max-w-sm">
        <LanguageSelector variant="settings" />
      </div>
    </section>
  );
}
