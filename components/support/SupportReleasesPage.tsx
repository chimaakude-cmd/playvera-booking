"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import {
  CURRENT_VERSION,
  getPublishedReleases,
  RELEASE_CATEGORY_LABELS,
  SEED_RELEASES,
  type Release,
  type ReleaseCategory,
} from "@/lib/releases";

const CATEGORY_STYLES: Record<ReleaseCategory, string> = {
  feature: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  ui: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  fix: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  security: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  performance: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  internal: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ReleaseCard({ release }: { release: Release }) {
  const displayDate = release.publishedAt ?? release.releaseDate;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900/40 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
          <Tag className="h-3 w-3" aria-hidden />
          v{release.version}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[release.type]}`}
        >
          {RELEASE_CATEGORY_LABELS[release.type]}
        </span>
        <time dateTime={displayDate} className="text-xs text-zinc-500">
          {formatDate(displayDate)}
        </time>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {release.title}
      </h2>
      {release.summary ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {release.summary}
        </p>
      ) : null}
      {release.features.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {release.features.slice(0, 5).map((item) => (
            <li key={item} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function SupportReleasesPage() {
  const [releases, setReleases] = useState<Release[]>(
    SEED_RELEASES.filter((release) => release.status === "published"),
  );

  useEffect(() => {
    setReleases(getPublishedReleases());
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Support"
          title="Release notes"
          subtitle={`Detailed changelog for Activora platform updates. Current version: ${CURRENT_VERSION}.`}
        />

        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {releases.map((release) => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </div>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
