"use client";

import { useEffect, useState } from "react";
import { Sparkles, Tag } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import {
  CURRENT_VERSION,
  getPublishedReleases,
  RELEASE_CATEGORY_LABELS,
  SEED_RELEASES,
  VERSION_STRATEGY,
  type Release,
  type ReleaseCategory,
} from "@/lib/releases";

const CATEGORY_STYLES: Record<ReleaseCategory, string> = {
  feature: "bg-violet-50 text-violet-700",
  improvement: "bg-sky-50 text-sky-700",
  fix: "bg-amber-50 text-amber-800",
  security: "bg-red-50 text-red-700",
  performance: "bg-teal-50 text-teal-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SectionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {title}
      </h4>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-zinc-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReleaseSections({ release }: { release: Release }) {
  const hasStructured =
    release.features.length > 0 ||
    release.improvements.length > 0 ||
    release.fixes.length > 0 ||
    release.breakingChanges.length > 0;

  if (hasStructured) {
    return (
      <>
        <SectionList title="Features added" items={release.features} />
        <SectionList title="Improvements" items={release.improvements} />
        <SectionList title="Fixes" items={release.fixes} />
        <SectionList title="Breaking changes" items={release.breakingChanges} />
      </>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {release.details.map((detail) => (
        <li key={detail} className="flex gap-2 text-sm text-zinc-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
          {detail}
        </li>
      ))}
    </ul>
  );
}

export function UpdatesPage() {
  const [releases, setReleases] = useState<Release[]>(
    SEED_RELEASES.filter((r) => r.status === "published" && !r.internalOnly),
  );

  useEffect(() => {
    setReleases(getPublishedReleases());
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Platform"
          title="What's New"
          subtitle="Follow the latest improvements, fixes and features across Activora."
        >
          <p className="text-sm font-semibold text-teal-200">
            Current version: Activora {CURRENT_VERSION}
          </p>
        </TransparencyHero>

        <section className="border-b border-zinc-100 bg-zinc-50/60 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-900">Version strategy</h2>
            <p className="mt-2 text-sm text-zinc-600">
              We ship in small, public releases from 0.5 through 1.2.
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {VERSION_STRATEGY.map((item) => (
                <li
                  key={item.version}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    item.version === CURRENT_VERSION
                      ? "border-teal-300 bg-teal-50 font-semibold text-teal-900"
                      : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  <span className="font-bold">v{item.version}</span>
                  <span className="mt-1 block text-xs font-normal text-zinc-500">
                    {item.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
              <Sparkles className="h-6 w-6 text-teal-600" aria-hidden />
              Releases
            </h2>

            <div className="mt-8 space-y-6">
              {releases.map((release) => (
                <article
                  key={release.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-teal-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        v{release.version} · {formatDate(release.releaseDate)}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-zinc-900">
                        {release.title}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_STYLES[release.type]}`}
                    >
                      <Tag className="h-3 w-3" aria-hidden />
                      {RELEASE_CATEGORY_LABELS[release.type]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600">{release.summary}</p>
                  <ReleaseSections release={release} />
                </article>
              ))}
            </div>

            <p className="mt-12 text-center text-sm font-medium text-zinc-500">
              Built publicly. Updated regularly.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
