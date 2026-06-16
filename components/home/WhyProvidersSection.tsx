"use client";

import { Check } from "lucide-react";
import { ACTIVORA_ACCENT, PROVIDER_BENEFITS } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_CARD, HOME_SECTION } from "./shared";

export function WhyProvidersSection() {
  const { t } = useTranslation("homepage");

  return (
    <section
      id="why-activora"
      aria-labelledby="why-activora-heading"
      className={`scroll-mt-24 bg-[#F8FAFC] ${HOME_SECTION}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: ACTIVORA_ACCENT }}
          >
            {t("whyProviders.eyebrow")}
          </p>
          <h2
            id="why-activora-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl"
          >
            {t("whyProviders.title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            {t("whyProviders.subtitle")}
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {PROVIDER_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className={`flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0F172A] ${HOME_CARD}`}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: ACTIVORA_ACCENT }}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <blockquote
          className={`mx-auto mt-10 max-w-2xl border border-slate-200 bg-white px-6 py-5 text-center ${HOME_CARD}`}
        >
          <p className="text-base italic leading-relaxed text-slate-700">
            {t("whyProviders.testimonial")}
          </p>
          <footer className="mt-3 text-sm font-semibold text-slate-500">
            {t("whyProviders.testimonialAuthor")}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
