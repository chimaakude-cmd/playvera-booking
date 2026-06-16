"use client";

import { getLocaleMeta, SUPPORTED_LOCALES, useTranslation } from "@/lib/i18n";
import { ACTIVORA_ACCENT } from "@/lib/home/constants";
import { HOME_BUTTON, HOME_CARD, HOME_SECTION } from "./shared";

export function LanguageCommunitySection() {
  const { t } = useTranslation("homepage");

  return (
    <section
      aria-labelledby="language-community-heading"
      className={`bg-white ${HOME_SECTION}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="language-community-heading"
            className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl"
          >
            {t("languageCommunity.title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {t("languageCommunity.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_LOCALES.map((locale) => {
            const meta = getLocaleMeta(locale.code);

            return (
              <article
                key={locale.code}
                className={`border border-slate-200 bg-[#F8FAFC] p-5 transition-shadow hover:shadow-md ${HOME_CARD}`}
              >
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {meta.nativeLabel}
                </h3>
                <p className="text-sm text-slate-500">{meta.region}</p>
              </article>
            );
          })}

          <article
            className={`flex flex-col items-center justify-center border border-dashed border-slate-300 bg-[#F8FAFC] p-5 ${HOME_CARD}`}
          >
            <span
              className={`px-3 py-1 text-xs font-semibold text-white ${HOME_BUTTON}`}
              style={{ backgroundColor: ACTIVORA_ACCENT }}
            >
              {t("languageCommunity.moreComing")}
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
