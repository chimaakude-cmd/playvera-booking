"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { Logo, LogoMark } from "@/components/branding";
import { BRAND_NAME } from "@/lib/brand";
import { translateParentNavLabel, useTranslation } from "@/lib/i18n";

const navItems = [
  { href: "/parent/dashboard", label: "Dashboard" },
  { href: "/parent/children", label: "Children" },
  { href: "/parent/bookings", label: "Bookings" },
  { href: "/parent/waitlist", label: "Waitlist" },
  { href: "/parent/profile", label: "Profile" },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation("dashboard");

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {translateParentNavLabel(item.href, item.label, t)}
          </Link>
        );
      })}
    </nav>
  );
}

export function ParentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <div className="lg:flex">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
          <div className="border-b border-zinc-100 px-6 py-5">
            <Logo size="desktop" href="/" />
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Parent Portal
            </p>
          </div>
          <div className="flex-1 px-4 py-6">
            <NavLinks pathname={pathname} />
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
            <aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">
              <div className="border-b border-zinc-100 px-6 py-5">
                <Logo
                  size="desktop"
                  href="/"
                  onClick={() => setMobileOpen(false)}
                />
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Parent Portal
                </p>
              </div>
              <div className="flex-1 px-4 py-6">
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-full flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
              >
                {t("parent.menu")}
              </button>
              <Link
                href="/"
                className="inline-flex transition-opacity hover:opacity-90"
                aria-label={BRAND_NAME}
              >
                <LogoMark size={34} />
              </Link>
              <span className="w-14" />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
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
