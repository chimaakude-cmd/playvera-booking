"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { Logo } from "@/components/branding";
import { HOME_BUTTON } from "./shared";

const NAV_LINKS = [
  { href: "/sessions", key: "activities" },
  { href: "/club/onboarding", key: "forClubs" },
  { href: "/pricing", key: "pricing" },
  { href: "/help/faq", key: "faq" },
  { href: "/contact", key: "support" },
] as const;

function scrollToSearch() {
  const section = document.getElementById("hero-search");
  section?.scrollIntoView({ behavior: "smooth", block: "center" });
  const input = document.getElementById("home-location");
  window.setTimeout(() => input?.focus(), 400);
}

export function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation("homepage");
  const { t: tc } = useTranslation("common");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#F8FAFC]/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="sm:hidden">
          <Logo size="mobile" priority />
        </div>
        <div className="hidden sm:block">
          <Logo size="desktop" priority />
        </div>

        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`${HOME_BUTTON} px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-[#0F172A]`}
            >
              {t(`header.nav.${link.key}`)}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToSearch}
            className={`hidden items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 sm:inline-flex ${HOME_BUTTON}`}
            aria-label={t("header.searchShortcut")}
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="hidden md:inline">{t("header.searchShortcut")}</span>
          </button>

          <LanguageSelector variant="header" />

          <Link
            href="/login"
            className={`hidden px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#0F172A] sm:inline-flex ${HOME_BUTTON}`}
          >
            {t("header.login")}
          </Link>

          <Link
            href="/#book-demo"
            className={`hidden border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:border-slate-300 sm:inline-flex ${HOME_BUTTON}`}
          >
            {t("header.bookDemo")}
          </Link>

          <Link
            href="/club/onboarding"
            className={`hidden px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:inline-flex ${HOME_BUTTON}`}
            style={{ backgroundColor: ACTIVORA_ACTION }}
          >
            {t("header.getStarted")}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 lg:hidden ${HOME_BUTTON}`}
            aria-expanded={menuOpen}
            aria-label={tc("buttons.openMenu")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`${HOME_BUTTON} px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50`}
                onClick={() => setMenuOpen(false)}
              >
                {t(`header.nav.${link.key}`)}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                scrollToSearch();
              }}
              className={`${HOME_BUTTON} px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50`}
            >
              {t("header.searchShortcut")}
            </button>
            <Link
              href="/login"
              className={`${HOME_BUTTON} px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50`}
              onClick={() => setMenuOpen(false)}
            >
              {t("header.login")}
            </Link>
            <Link
              href="/#book-demo"
              className={`${HOME_BUTTON} px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50`}
              onClick={() => setMenuOpen(false)}
            >
              {t("header.bookDemo")}
            </Link>
            <Link
              href="/club/onboarding"
              className={`${HOME_BUTTON} px-3 py-2.5 text-sm font-semibold text-white`}
              style={{ backgroundColor: ACTIVORA_ACTION }}
              onClick={() => setMenuOpen(false)}
            >
              {t("header.getStarted")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
