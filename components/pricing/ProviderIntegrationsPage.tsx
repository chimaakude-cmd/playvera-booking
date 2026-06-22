"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

const INTEGRATIONS = [
  {
    name: "Stripe",
    status: "Available",
    description:
      "Connect your club's Stripe account for card payments, payouts and finance reporting. Parents pay securely at checkout.",
    href: "/trust/stripe-payments",
  },
  {
    name: "GoCardless",
    status: "Available",
    description:
      "Direct Debit for term fees, subscriptions and recurring collections. Ideal for regular attendees.",
    href: "/trust/gocardless-payments",
  },
  {
    name: "Exports",
    status: "Available",
    description:
      "CSV and PDF exports for bookings, registers, finance and customer lists — compatible with spreadsheets and accounting tools.",
    href: "/contact?topic=exports",
  },
  {
    name: "Website widget",
    status: "Available",
    description:
      "Embed booking on your own website so parents book without leaving your site.",
    href: "/get-started",
  },
  {
    name: "Accounting integrations",
    status: "Coming soon",
    description:
      "Direct sync with Xero and QuickBooks for automated reconciliation.",
    href: "/contact?topic=integrations",
  },
  {
    name: "Access control & gates",
    status: "Future",
    description:
      "Explore partnerships for venue access and attendance verification.",
    href: "/contact?topic=integrations",
  },
] as const;

export function ProviderIntegrationsPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Providers"
      title="Integrations"
      subtitle="Connect payments, exports and your website to Activora."
      maxWidth="lg"
    >
      <TrustLegalSection id="overview" title="Overview">
        <p>
          Activora integrates with leading UK payment providers and offers flexible
          export tools. We are expanding our integration roadmap based on provider
          feedback.
        </p>
      </TrustLegalSection>

      <div className="not-prose grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <article
            key={item.name}
            className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900/40"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {item.name}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.status === "Available"
                    ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                    : item.status === "Coming soon"
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
            <Link
              href={item.href}
              className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-400"
            >
              Learn more →
            </Link>
          </article>
        ))}
      </div>
    </TrustLegalPageLayout>
  );
}
