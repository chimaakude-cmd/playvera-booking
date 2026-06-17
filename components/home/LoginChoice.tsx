"use client";

import Link from "next/link";
import { Building2, Shield, UserCircle, Users } from "lucide-react";
import { ACTIVORA_ACTION, ACTIVORA_PRIMARY } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_CARD } from "./shared";

const LOGIN_OPTIONS = [
  {
    key: "parent",
    href: "/parent/login",
    icon: UserCircle,
  },
  {
    key: "club",
    href: "/club/login",
    icon: Users,
  },
  {
    key: "org",
    href: "/organisation/login",
    icon: Building2,
  },
  {
    key: "admin",
    href: "/admin/login",
    icon: Shield,
  },
] as const;

export function LoginChoice({ className = "" }: { className?: string }) {
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");

  return (
    <div className={className}>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
          {t("login.heading")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          {t("login.subheading")}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2">
        {LOGIN_OPTIONS.map((option) => {
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
                {t(`login.${option.key}Title`)}
              </h2>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {t(`login.${option.key}Description`)}
              </p>

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
        <p className="text-sm text-slate-600">{t("login.footerText")}</p>
        <Link
          href="/signup"
          className={`inline-flex w-full items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2 sm:w-auto ${HOME_BUTTON}`}
          style={{ backgroundColor: ACTIVORA_ACTION }}
        >
          {t("login.footerLink")}
        </Link>
      </div>
    </div>
  );
}
