"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { Logo, LogoMark } from "@/components/branding";
import { BRAND_NAME } from "@/lib/brand";
import { getTotalUnreadCount } from "@/lib/inbox";
import {
  getCurrentClubRole,
  getNavGroupsForRole,
  type ClubNavItem,
  type ClubRole,
} from "@/lib/club-team";
import { translateClubNavLabel, useTranslation } from "@/lib/i18n";

function NavLinks({
  pathname,
  groups,
  inboxUnread,
  onNavigate,
}: {
  pathname: string;
  groups: Array<{ title: string; items: ClubNavItem[] }>;
  inboxUnread: number;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {group.title}
          </p>
          <nav className="mt-2 flex flex-col gap-1">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badge =
                item.badgeKey === "inbox" && inboxUnread > 0
                  ? inboxUnread
                  : null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <span>
                    {translateClubNavLabel(item.section, item.label, t)}
                  </span>
                  <span className="flex items-center gap-2">
                    {badge !== null ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-teal-500 text-white"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                    {item.soon ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isActive
                            ? "bg-white/15 text-white/90"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {tc("buttons.soon")}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function ClubShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<ClubRole>("owner");
  const [inboxUnread, setInboxUnread] = useState(0);
  const navGroups = getNavGroupsForRole(role);

  useEffect(() => {
    setRole(getCurrentClubRole());
  }, [pathname]);

  useEffect(() => {
    setInboxUnread(getTotalUnreadCount());
    const interval = window.setInterval(() => {
      setInboxUnread(getTotalUnreadCount());
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pathname]);

  return (
    <div className="min-h-full bg-[#f6f7f9] text-zinc-900">
      <div className="lg:flex">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-200/80 bg-white lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
          <div className="border-b border-zinc-100 px-6 py-5">
            <Logo size="desktop" href="/" />
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-teal-700">
              Club dashboard
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <NavLinks pathname={pathname} groups={navGroups} inboxUnread={inboxUnread} />
          </div>
          <div className="border-t border-zinc-100 px-6 py-4 text-xs text-zinc-400">
            © {new Date().getFullYear()} {BRAND_NAME}
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-80 flex-col bg-white shadow-xl">
              <div className="border-b border-zinc-100 px-6 py-5">
                <Logo
                  size="desktop"
                  href="/"
                  onClick={() => setMobileOpen(false)}
                />
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-teal-700">
                  Club dashboard
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <NavLinks
                  pathname={pathname}
                  groups={navGroups}
                  inboxUnread={inboxUnread}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-full flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
              >
                {t("club.menu")}
              </button>
              <Link
                href="/club/dashboard"
                className="inline-flex transition-opacity hover:opacity-90"
                aria-label={BRAND_NAME}
              >
                <LogoMark size={34} />
              </Link>
              <NotificationBell />
            </div>
          </header>

          <div className="hidden lg:block">
            <div className="fixed right-8 top-6 z-30">
              <NotificationBell />
            </div>
          </div>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
            {children}
          </main>

          <footer className="border-t border-zinc-200 bg-white px-4 py-4 text-center text-xs text-zinc-400 lg:hidden">
            © {new Date().getFullYear()} {BRAND_NAME}
          </footer>
        </div>
      </div>
      <LazySupportLauncher />
    </div>
  );
}
