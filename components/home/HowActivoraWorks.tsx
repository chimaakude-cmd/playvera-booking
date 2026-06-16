"use client";

import { ACTIVORA_ACTION, HOW_IT_WORKS } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_SECTION } from "./shared";

export function HowActivoraWorks() {
  const { t } = useTranslation("homepage");

  return (
    <section
      id="how-it-works"
      className={`scroll-mt-24 bg-white ${HOME_SECTION}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <p
            className="mt-2 text-sm font-semibold"
            style={{ color: ACTIVORA_ACTION }}
          >
            {t("howItWorks.speedNote")}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {HOW_IT_WORKS.map((item, index) => (
            <div key={item.step} className="relative text-center">
              {index < HOW_IT_WORKS.length - 1 ? (
                <div
                  className="absolute left-[calc(50%+2rem)] top-7 hidden h-px w-[calc(100%-4rem)] border-t-2 border-dashed lg:block"
                  style={{ borderColor: `${ACTIVORA_ACTION}30` }}
                  aria-hidden
                />
              ) : null}

              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white"
                style={{ backgroundColor: ACTIVORA_ACTION }}
              >
                {item.step}
              </div>
              <div className="mx-auto mb-2 text-2xl">{item.icon}</div>
              <h3 className="text-base font-bold text-[#0F172A]">{item.title}</h3>
              <p className="mx-auto mt-1.5 max-w-[220px] text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
