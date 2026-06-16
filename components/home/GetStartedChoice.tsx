"use client";

import Link from "next/link";
import { Building2, Landmark, Users } from "lucide-react";
import { ACTIVORA_ACTION, ACTIVORA_PRIMARY } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_CARD } from "./shared";

const ACCOUNT_TYPES = [
  {
    key: "club",
    href: "/club/onboarding",
    icon: Users,
  },
  {
    key: "franchisor",
    href: "/franchisor/onboarding",
    icon: Building2,
  },
  {
    key: "enterprise",
    href: "/enterprise/onboarding",
    icon: Landmark,
  },
] as const;

export function GetStartedChoice({ className = "" }: { className?: string }) {
  const { t } = useTranslation("homepage");
  const { t: tc } = useTranslation("common");

  return (
    <div className={className}>
      <div className="mb-6 sm:mb-8">
        <Link
          href="/"
          className={`inline-flex items-center border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2 ${HOME_BUTTON}`}
          style={{ color: ACTIVORA_PRIMARY }}
        >
          ← Back
        </Link>
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
          {t("getStarted.title")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          {t("getStarted.subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACCOUNT_TYPES.map((option) => {
          const Icon = option.icon;
          return (
            <Link
              key={option.key}
              href={option.href}
              className={`group flex flex-col border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#2563EB]/40 hover:shadow-md sm:p-8 ${HOME_CARD} ${HOME_BUTTON}`}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: ACTIVORA_ACTION }}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </span>

              <h2
                className="mt-5 text-lg font-semibold sm:text-xl"
                style={{ color: ACTIVORA_PRIMARY }}
              >
                {t(`getStarted.options.${option.key}.title`)}
              </h2>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {t(`getStarted.options.${option.key}.description`)}
              </p>

              <span
                className="mt-4 inline-flex self-start rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                {t("getStarted.freeBadge")}
              </span>

              <span
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-colors group-hover:opacity-80"
                style={{ color: ACTIVORA_ACTION }}
              >
                {tc("buttons.continue")}
                <span aria-hidden>→</span>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 px-4 text-center sm:px-0">
        <p className="text-sm text-slate-600">{t("getStarted.footerText")}</p>
        <Link
          href="/login"
          className={`inline-flex w-full items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2 sm:w-auto ${HOME_BUTTON}`}
          style={{ backgroundColor: ACTIVORA_ACTION }}
        >
          {t("getStarted.signInButton")}
        </Link>
      </div>
    </div>
  );
}
