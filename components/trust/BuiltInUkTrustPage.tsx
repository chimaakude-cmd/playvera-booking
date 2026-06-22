"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function BuiltInUkTrustPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Trust"
      title="Built in the UK"
      subtitle="UK-designed booking software for clubs, schools and activity providers — with local support and safeguarding at the core."
    >
      <TrustLegalSection id="uk-designed" title="Designed and built in the UK">
        <p>
          Activora is designed, developed and managed in the United Kingdom. We
          have no plans to move core development overseas. Our team understands UK
          clubs, term-time schedules, safeguarding expectations and the realities
          of running activities on tight budgets.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="schools-clubs" title="Built for schools and clubs">
        <p>
          From after-school clubs and holiday camps to sports academies and
          franchise networks, Activora handles the workflows UK providers actually
          use — registers, term fees, sibling discounts, waiting lists and
          parent communications that fit around the school day.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="safeguarding" title="UK safeguarding standards">
        <p>
          We align platform features with UK child protection expectations: emergency
          contacts, medical notes, attendance tracking and controlled staff access.
          Read our full{" "}
          <Link href="/trust/safeguarding" className="font-semibold text-teal-700 dark:text-teal-400">
            Safeguarding
          </Link>{" "}
          page for details.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="local-support" title="Local support">
        <p>
          Our support team operates on UK hours — Monday to Friday 07:00–18:00 and
          Saturday to Sunday 09:00–12:00. See{" "}
          <Link href="/trust/support-hours" className="font-semibold text-teal-700 dark:text-teal-400">
            Support hours
          </Link>{" "}
          for response targets. We aim to give practical help from people who
          understand your context, not generic scripts.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="team" title="Who we are">
        <p>
          Activora is managed day to day by TeamOneQ, enabling rapid updates and
          improvements based on real feedback from clubs, parents and providers
          across the UK.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
