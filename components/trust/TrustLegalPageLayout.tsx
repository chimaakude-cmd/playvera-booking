import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";

type TrustLegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  heroExtra?: ReactNode;
  maxWidth?: "md" | "lg" | "xl";
};

const MAX_WIDTH_CLASS = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
} as const;

export function TrustLegalPageLayout({
  eyebrow,
  title,
  subtitle,
  children,
  heroExtra,
  maxWidth = "md",
}: TrustLegalPageLayoutProps) {
  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero eyebrow={eyebrow} title={title} subtitle={subtitle}>
          {heroExtra}
        </TransparencyHero>

        <article
          className={`mx-auto ${MAX_WIDTH_CLASS[maxWidth]} px-4 py-10 sm:px-6 sm:py-12 lg:px-8`}
        >
          <div className="prose prose-zinc max-w-none space-y-8 text-base leading-7 text-zinc-700 dark:prose-invert dark:text-zinc-300">
            {children}
          </div>
        </article>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}

export function TrustLegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id ?? title.replace(/\s+/g, "-").toLowerCase()}>
      <h2
        id={id ?? title.replace(/\s+/g, "-").toLowerCase()}
        className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
      >
        {title}
      </h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}
