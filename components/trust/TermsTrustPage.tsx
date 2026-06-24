"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

export function TermsTrustPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The agreement between Activora, activity providers and parents who use our booking platform."
      heroExtra={
        <p className="text-sm text-teal-100/90">Last updated: 22 June 2026</p>
      }
    >
      <TrustLegalSection id="acceptance" title="1. Acceptance of terms">
        <p>
          By creating an account, listing activities, or making a booking through
          Activora, you agree to these Terms of Service and our Privacy Policy. If
          you do not agree, please do not use the platform.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="services" title="2. Our services">
        <p>
          Activora provides software for activity providers — including clubs,
          schools and franchises — to manage sessions, bookings, payments and
          parent communications. Parents use Activora to discover activities, book
          sessions and manage their children&apos;s participation.
        </p>
        <p>
          We may update features, pricing and availability. Material changes will
          be communicated through the platform or by email where appropriate.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="accounts" title="3. Accounts and responsibilities">
        <p>
          You must provide accurate information when registering. Providers are
          responsible for the accuracy of session listings, pricing, cancellation
          policies and safeguarding arrangements. Parents are responsible for
          accurate child profiles, emergency contacts and medical information.
        </p>
        <p>
          Keep login credentials secure. Notify us promptly if you suspect
          unauthorised access to your account.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="bookings" title="4. Bookings and payments">
        <p>
          A booking is a contract between the parent and the activity provider.
          Activora facilitates the transaction but is not the activity provider.
          Payment processing is handled by Stripe and/or GoCardless on the
          provider&apos;s connected account.
        </p>
        <p>
          Activora charges a standard platform fee of 2.5% per transaction on
          successfully processed bookings. See our{" "}
          <Link href="/providers/pricing" className="font-semibold text-teal-700 dark:text-teal-400">
            pricing page
          </Link>{" "}
          for current rates.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="cancellations" title="5. Cancellations and refunds">
        <p>
          Refund and cancellation rules are set by each provider and displayed at
          checkout. Activora may assist with dispute resolution but does not
          guarantee refunds outside the provider&apos;s stated policy.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="acceptable-use" title="6. Acceptable use">
        <p>
          You must not misuse the platform, attempt to access data you are not
          authorised to view, upload harmful content, or use Activora for unlawful
          purposes. We may suspend accounts that breach these terms or pose a
          safeguarding risk.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="liability" title="7. Limitation of liability">
        <p>
          Activora is provided &quot;as is&quot; to the extent permitted by law. We are
          not liable for provider conduct, session quality, injuries at activities,
          or payment disputes between parents and providers, except where liability
          cannot be excluded under UK law.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="contact" title="8. Contact">
        <p>
          Questions about these terms?{" "}
          <Link href="/contact" className="font-semibold" style={{ color: ACTIVORA_ACTION }}>
            Contact our team
          </Link>
          . For data protection matters, see our{" "}
          <Link href="/privacy" className="font-semibold text-teal-700 dark:text-teal-400">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/trust/dpa" className="font-semibold text-teal-700 dark:text-teal-400">
            Data Processing Agreement
          </Link>
          .
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
