"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function ParentRefundsPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Parents"
      title="Refund Policy"
      subtitle="How refunds work between parents, activity providers and the Activora platform."
    >
      <TrustLegalSection id="provider-policies" title="Provider policies">
        <p>
          Each activity provider sets their own cancellation and refund policy,
          displayed before you complete a booking. Policies may vary by session
          type — for example, term courses vs single drop-in sessions. Read the
          policy carefully at checkout.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="refund-requests" title="Requesting a refund">
        <p>
          To request a refund, contact the provider first through your booking
          details or Activora messaging. If the provider approves, refunds are
          processed to your original payment method — typically within 5–10 business
          days depending on your bank or card issuer.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="platform-role" title="Activora's role">
        <p>
          Activora facilitates payments but does not set provider refund policies.
          We can help locate booking records and contact providers when disputes
          arise, but cannot guarantee refunds outside the provider&apos;s stated
          terms except where required by consumer law.
        </p>
        <p>
          For booking protection when sessions are cancelled by the provider, see{" "}
          <Link href="/parents/booking-protection" className="font-semibold text-teal-700 dark:text-teal-400">
            Booking Protection
          </Link>
          .
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
