"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

const ROADMAP_ITEMS = [
  {
    title: "Accounting integrations",
    status: "In progress",
    description: "Direct sync with Xero and QuickBooks for finance teams.",
    quarter: "Q3 2026",
  },
  {
    title: "Enhanced franchise reporting",
    status: "Planned",
    description: "Cross-club dashboards, benchmarking and consolidated exports.",
    quarter: "Q3 2026",
  },
  {
    title: "Parent mobile app improvements",
    status: "Planned",
    description: "Faster booking, push notifications and offline register viewing.",
    quarter: "Q4 2026",
  },
  {
    title: "Automated waitlist offers",
    status: "Planned",
    description: "Smart notifications when places open with configurable time limits.",
    quarter: "Q4 2026",
  },
  {
    title: "Multi-language club pages",
    status: "Exploring",
    description: "Welsh, Gaelic and community language support for public listings.",
    quarter: "2027",
  },
] as const;

export function CompanyRoadmapPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Company"
      title="Roadmap"
      subtitle="What we're building next — informed by feedback from clubs and parents."
      maxWidth="lg"
    >
      <TrustLegalSection id="overview" title="How we prioritise">
        <p>
          Our roadmap reflects the most-requested features from providers and
          parents. Timelines are indicative and may shift as we learn. Vote and
          suggest ideas on our{" "}
          <Link href="/support/feature-requests" className="font-semibold text-teal-700 dark:text-teal-400">
            Feature requests
          </Link>{" "}
          board.
        </p>
      </TrustLegalSection>

      <div className="not-prose space-y-4">
        {ROADMAP_ITEMS.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h2>
              <div className="flex gap-2">
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                  {item.status}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {item.quarter}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      <TrustLegalSection id="shipped" title="Recently shipped">
        <p>
          See what we have already released on{" "}
          <Link href="/support/releases" className="font-semibold text-teal-700 dark:text-teal-400">
            Release notes
          </Link>{" "}
          and{" "}
          <Link href="/updates" className="font-semibold text-teal-700 dark:text-teal-400">
            What&apos;s new
          </Link>
          .
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
