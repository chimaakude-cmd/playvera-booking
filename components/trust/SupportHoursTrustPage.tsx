"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";
import { FOOTER_SUPPORT_HOURS } from "@/lib/callback-requests";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

const RESPONSE_TARGETS = [
  {
    priority: "Critical",
    description: "Platform outage, payment failure affecting multiple bookings, or safeguarding-related account access",
    target: "Within 4 hours during support hours",
  },
  {
    priority: "High",
    description: "Single-provider payment issues, unable to access dashboard, or data export needed urgently",
    target: "Within 1 working day",
  },
  {
    priority: "Normal",
    description: "General questions, feature guidance, billing queries and non-urgent requests",
    target: "Within 2 working days",
  },
] as const;

export function SupportHoursTrustPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Support"
      title="Support hours"
      subtitle="When our team is available and how quickly we aim to respond."
    >
      <TrustLegalSection id="opening-hours" title="Opening hours">
        <div className="not-prose rounded-2xl border border-teal-100 bg-teal-50/50 px-5 py-4 dark:border-teal-900/50 dark:bg-teal-950/30">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Support availability
          </p>
          <p className="mt-1 text-base text-zinc-700 dark:text-zinc-300">
            {FOOTER_SUPPORT_HOURS}
          </p>
        </div>
        <p>
          During support hours we aim to respond as quickly as possible. High
          workloads, platform updates or incident response may occasionally delay
          replies — we will always acknowledge urgent issues promptly.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="response-targets" title="Response targets">
        <div className="not-prose space-y-4">
          {RESPONSE_TARGETS.map((item) => (
            <div
              key={item.priority}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {item.priority}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>
              <p className="mt-2 text-sm font-medium text-teal-700 dark:text-teal-400">
                Target: {item.target}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enterprise plans may include enhanced SLAs as part of your agreement.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="outside-hours" title="Outside support hours">
        <p>
          You can still submit requests via{" "}
          <Link href="/contact" className="font-semibold" style={{ color: ACTIVORA_ACTION }}>
            Contact
          </Link>{" "}
          or the in-app support bubble. Non-urgent messages received outside hours
          are queued for the next available support window. Critical incidents
          affecting platform availability are monitored separately — see{" "}
          <Link href="/status" className="font-semibold text-teal-700 dark:text-teal-400">
            System status
          </Link>
          .
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="callback" title="Request a callback">
        <p>
          Prefer a phone call? Use{" "}
          <Link href="/contact?tab=callback" className="font-semibold text-teal-700 dark:text-teal-400">
            Request callback
          </Link>{" "}
          and we will ring you back during support hours.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
