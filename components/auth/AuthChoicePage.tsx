"use client";

import Link from "next/link";
import { Logo } from "@/components/branding";
import { useTranslation } from "@/lib/i18n";

type AuthMode = "login" | "signup";

const LOGIN_OPTIONS = [
  {
    key: "parent",
    href: "/parent/login",
    icon: "👨‍👩‍👧",
  },
  {
    key: "club",
    href: "/club/login",
    icon: "🏟️",
  },
  {
    key: "org",
    href: "/organisation/login",
    icon: "🏢",
  },
] as const;

const SIGNUP_OPTIONS = [
  {
    key: "parent",
    href: "/parent/signup",
    icon: "👨‍👩‍👧",
  },
  {
    key: "club",
    href: "/club/onboarding",
    icon: "🏟️",
  },
  {
    key: "org",
    href: "/organisation/onboarding",
    icon: "🏢",
  },
] as const;

export function AuthChoicePage({ mode }: { mode: AuthMode }) {
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");
  const options = mode === "login" ? LOGIN_OPTIONS : SIGNUP_OPTIONS;
  const prefix = mode;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f9] px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="desktop" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            {t(`${prefix}.heading`)}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{t(`${prefix}.subheading`)}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option, index) => (
            <Link
              key={option.href}
              href={option.href}
              className={`group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:border-violet-200 hover:shadow-md${
                index === options.length - 1
                  ? " sm:col-span-2 sm:max-w-md sm:justify-self-center lg:col-span-1 lg:max-w-none"
                  : ""
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-2xl">
                {option.icon}
              </span>
              <h2 className="mt-4 text-lg font-semibold text-zinc-900 group-hover:text-violet-900">
                {t(`${prefix}.${option.key}Title`)}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                {t(`${prefix}.${option.key}Description`)}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
                {tc("buttons.continue")}
                <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          {t(`${prefix}.footerText`)}{" "}
          <Link
            href={mode === "login" ? "/signup" : "/login"}
            className="font-medium text-violet-700 hover:text-violet-900"
          >
            {t(`${prefix}.footerLink`)}
          </Link>
        </p>
      </div>
    </div>
  );
}
