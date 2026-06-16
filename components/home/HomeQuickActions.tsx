"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bug,
  CalendarDays,
  MessageCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import { openSupportDrawer } from "@/lib/inbox/storage";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON } from "./shared";

function scrollToSearch() {
  const section = document.getElementById("hero-search");
  section?.scrollIntoView({ behavior: "smooth", block: "center" });
  const input = document.getElementById("home-location");
  window.setTimeout(() => input?.focus(), 400);
}

export function HomeQuickActions() {
  const { t } = useTranslation("homepage");
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-30 flex flex-col items-start gap-2">
      {open ? (
        <div className={`fab-menu-enter overflow-hidden border border-slate-200 bg-white shadow-xl ${HOME_BUTTON}`}>
          <ul className="py-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  scrollToSearch();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[#0F172A] transition-colors hover:bg-slate-50"
              >
                <Search className="h-4 w-4 text-slate-600" aria-hidden />
                {t("quickActions.search")}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openSupportDrawer({ newChat: true });
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[#0F172A] transition-colors hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4 text-slate-600" aria-hidden />
                {t("quickActions.support")}
              </button>
            </li>
            <li>
              <Link
                href="#book-demo"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4 text-slate-600" aria-hidden />
                {t("quickActions.bookDemo")}
              </Link>
            </li>
            <li>
              <Link
                href="/report-bug"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:bg-slate-50"
              >
                <Bug className="h-4 w-4 text-slate-600" aria-hidden />
                {t("quickActions.reportBug")}
              </Link>
            </li>
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex h-12 w-12 items-center justify-center text-white shadow-lg transition-transform hover:scale-105 ${HOME_BUTTON}`}
        style={{ backgroundColor: ACTIVORA_ACTION }}
        aria-expanded={open}
        aria-label={t("quickActions.open")}
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Plus className="h-5 w-5" aria-hidden />
        )}
      </button>
    </div>
  );
}
