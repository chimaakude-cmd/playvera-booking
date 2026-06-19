"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ActivoraLogo } from "@/components/branding/logo";
import { SiteFooter } from "@/components/SiteFooter";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

type StaticInfoPageLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function StaticInfoPageLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: StaticInfoPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F3] text-[#0F172A]">
      <header className="shrink-0 border-b border-orange-100/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <ActivoraLogo size="desktop" href="/" priority />
          <Link
            href="/contact"
            className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-orange-50"
          >
            Contact
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-10">
            <p
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: ACTIVORA_ACTION }}
            >
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 text-base leading-7 text-zinc-600">
                {subtitle}
              </p>
            ) : null}
            <div className="mt-8 space-y-5 text-base leading-7 text-zinc-700">
              {children}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
