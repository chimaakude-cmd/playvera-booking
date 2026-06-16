"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, ThumbsUp } from "lucide-react";
import {
  getLatestPublishedReleases,
  RELEASE_CATEGORY_LABELS,
  SEED_RELEASES,
  type Release,
  type ReleaseCategory,
} from "@/lib/releases";
import { ACTIVORA_ACCENT, ACTIVORA_ACTION } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_CARD, HOME_SECTION } from "./shared";

const CATEGORY_STYLES: Record<ReleaseCategory, string> = {
  feature: "bg-blue-50 text-blue-700",
  improvement: "bg-slate-100 text-slate-700",
  fix: "bg-amber-50 text-amber-800",
  security: "bg-red-50 text-red-700",
  performance: "bg-teal-50 text-teal-700",
};

const COMING_SOON = {
  version: "0.6",
  title: "Parent waitlists",
  summary: "Let parents join a waitlist when sessions are full — auto-notify when a space opens.",
  votes: 47,
} as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LatestUpdatesSection() {
  const { t } = useTranslation("homepage");
  const [releases, setReleases] = useState<Release[]>(
    SEED_RELEASES.filter((r) => r.status === "published" && !r.internalOnly).slice(
      0,
      2,
    ),
  );

  useEffect(() => {
    setReleases(getLatestPublishedReleases(2));
  }, []);

  return (
    <section className={`bg-[#F8FAFC] ${HOME_SECTION}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
              style={{ color: ACTIVORA_ACCENT }}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {t("updates.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A]">
              {t("updates.title")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{t("updates.subtitle")}</p>
          </div>
          <Link
            href="/updates"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: ACTIVORA_ACTION }}
          >
            {t("updates.viewAll")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {releases.map((release) => (
            <article
              key={release.id}
              className={`flex flex-col border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${HOME_CARD}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  v{release.version} · {formatDate(release.releaseDate)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_STYLES[release.type]}`}
                >
                  {RELEASE_CATEGORY_LABELS[release.type]}
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0F172A]">
                {release.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {release.summary}
              </p>
            </article>
          ))}

          <article
            className={`flex flex-col border border-dashed border-slate-300 bg-white p-5 ${HOME_CARD}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">
                v{COMING_SOON.version}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${HOME_BUTTON}`}
                style={{ backgroundColor: ACTIVORA_ACCENT }}
              >
                {t("updates.comingSoon")}
              </span>
            </div>
            <h3 className="mt-3 text-base font-bold text-[#0F172A]">
              {COMING_SOON.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
              {COMING_SOON.summary}
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <ThumbsUp className="h-3.5 w-3.5" style={{ color: ACTIVORA_ACTION }} aria-hidden />
              {t("updates.votes", { count: COMING_SOON.votes })}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
