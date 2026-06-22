"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function DpaTrustPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Legal"
      title="Data Processing Agreement"
      subtitle="How Activora processes personal data on behalf of activity providers under UK GDPR."
      heroExtra={
        <p className="text-sm text-teal-100/90">Last updated: 22 June 2026</p>
      }
    >
      <TrustLegalSection id="roles" title="Controller and processor roles">
        <p>
          Activity providers are typically the <strong>data controller</strong> for
          parent and child data they collect through bookings, registers and
          communications. Activora acts as a <strong>data processor</strong> when
          handling that data on the provider&apos;s instructions to deliver the
          platform.
        </p>
        <p>
          Activora is the controller for its own account, billing, marketing and
          platform analytics data. See our{" "}
          <Link href="/privacy" className="font-semibold text-teal-700 dark:text-teal-400">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="ownership" title="Data ownership">
        <p>
          Providers retain ownership of their customer lists, booking records,
          session data and communications content. Activora does not sell provider
          or parent data to third parties. Export tools are available so providers
          can retrieve their data at any time.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="processing" title="Processing instructions">
        <p>
          We process personal data only to provide, secure and improve the
          Activora platform — including bookings, payments, registers, messaging,
          reporting and support. We do not use provider customer data for unrelated
          marketing without consent.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="deletion" title="Deletion and portability">
        <p>
          Providers may export data via dashboard tools. On account closure, we
          delete or anonymise personal data within 90 days unless retention is
          required by law, ongoing disputes, or legitimate business records (such
          as invoicing). Parents may exercise rights directly with their provider
          or contact Activora for assistance.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="retention" title="Retention">
        <p>
          Retention periods vary by data type. Booking and payment records may be
          kept for up to seven years for accounting and tax purposes. Safeguarding
          and attendance registers may be retained according to provider policy and
          legal requirements. Full details are in our Privacy Policy.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="security" title="Security measures">
        <p>
          We implement encryption in transit and at rest, role-based access controls,
          audit logging, regular backups and infrastructure monitoring. See{" "}
          <Link href="/trust/security" className="font-semibold text-teal-700 dark:text-teal-400">
            Data Storage & Security
          </Link>{" "}
          for a full overview.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="subprocessors" title="Sub-processors">
        <p>
          We use trusted sub-processors to deliver the platform, including:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cloud hosting and database (EU/UK regions where available)</li>
          <li>Stripe — card payment processing</li>
          <li>GoCardless — Direct Debit collections</li>
          <li>Email and notification delivery providers</li>
        </ul>
        <p>
          We maintain agreements requiring sub-processors to meet GDPR-equivalent
          standards. Material changes to sub-processors will be notified to
          providers.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="request-dpa" title="Request a signed DPA">
        <p>
          Enterprise and franchisor customers may request a countersigned DPA.{" "}
          <Link href="/contact?topic=dpa" className="font-semibold text-teal-700 dark:text-teal-400">
            Contact us
          </Link>{" "}
          with your organisation details and we will arrange this.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
