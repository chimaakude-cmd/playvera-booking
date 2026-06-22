"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

export function CompanyAboutPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Company"
      title="About Activora"
      subtitle="Making activity bookings simpler for UK clubs, schools and families."
    >
      <TrustLegalSection id="mission" title="Our mission">
        <p>
          Activora exists to give activity providers modern booking tools without
          enterprise complexity or hidden costs. We believe clubs, coaches and
          franchise operators should spend less time on admin and more time with
          the people they serve.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="story" title="Why we built Activora">
        <p>
          After seeing clubs struggle with outdated software, fragmented
          spreadsheets and expensive platforms, we set out to build something
          better — designed in the UK, priced transparently, and focused on the
          workflows that matter for children&apos;s activities.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="values" title="What we stand for">
        <ul className="list-disc space-y-2 pl-5">
          <li>Transparent pricing with no surprise fees</li>
          <li>Safeguarding-aware tools for children&apos;s activities</li>
          <li>Fast, human support from a UK-based team</li>
          <li>Continuous improvement driven by provider feedback</li>
        </ul>
      </TrustLegalSection>

      <TrustLegalSection id="team" title="TeamOneQ">
        <p>
          Activora is managed day to day by TeamOneQ, enabling rapid updates and
          direct relationships with the clubs and parents who use the platform.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="join" title="Join us">
        <p>
          Explore{" "}
          <Link href="/careers" className="font-semibold text-teal-700 dark:text-teal-400">
            Careers
          </Link>
          ,{" "}
          <Link href="/partnerships" className="font-semibold text-teal-700 dark:text-teal-400">
            Partner with us
          </Link>
          , or{" "}
          <Link href="/get-started" className="font-semibold" style={{ color: ACTIVORA_ACTION }}>
            get started
          </Link>{" "}
          as a provider today.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
