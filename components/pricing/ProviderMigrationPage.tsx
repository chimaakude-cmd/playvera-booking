"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

const MIGRATION_SOURCES = [
  {
    name: "ClassForKids",
    description:
      "We can help migrate sessions, customer lists and historical booking data from ClassForKids exports.",
  },
  {
    name: "Pebble",
    description:
      "Moving from Pebble? Our team supports CSV-based imports for families, sessions and registers.",
  },
  {
    name: "Coacha",
    description:
      "Coacha users can transition with guided onboarding and data mapping for teams and schedules.",
  },
  {
    name: "Spreadsheets",
    description:
      "Still on Excel or Google Sheets? We provide templates and assisted imports to get you live quickly.",
  },
] as const;

export function ProviderMigrationPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Providers"
      title="Migration support"
      subtitle="Switch to Activora without losing your customer relationships or session history."
    >
      <TrustLegalSection id="approach" title="Our approach">
        <p>
          Changing booking systems is a big decision. Our migration support helps
          you move data safely, train your team and go live with minimal disruption
          to parents.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="sources" title="Supported sources">
        <div className="not-prose space-y-4">
          {MIGRATION_SOURCES.map((source) => (
            <div
              key={source.name}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {source.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {source.description}
              </p>
            </div>
          ))}
        </div>
      </TrustLegalSection>

      <TrustLegalSection id="process" title="Migration process">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Export your data from your current system (we provide guidance)</li>
          <li>Share exports securely with our onboarding team</li>
          <li>We map and import sessions, customers and settings</li>
          <li>You review and test before switching parent-facing links</li>
          <li>Go live with support during your first booking week</li>
        </ol>
      </TrustLegalSection>

      <TrustLegalSection id="enterprise" title="Franchisor & Enterprise">
        <p>
          Multi-site operators receive dedicated migration planning, bulk imports
          and phased rollouts.{" "}
          <Link href="/contact?topic=migration" className="font-semibold" style={{ color: ACTIVORA_ACTION }}>
            Contact us
          </Link>{" "}
          to discuss your timeline.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
