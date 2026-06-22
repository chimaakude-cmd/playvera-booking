"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function ParentSafetyPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Parents"
      title="Parent Safety"
      subtitle="What Activora and your activity provider do to keep children safe when booking and attending sessions."
    >
      <TrustLegalSection id="verification" title="Provider verification">
        <p>
          Activity providers on Activora complete onboarding before accepting
          bookings. We verify business details and review listings for completeness.
          Always check a provider&apos;s public profile, policies and reviews before
          booking.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="medical" title="Medical and emergency information">
        <p>
          Add accurate medical conditions, allergies and emergency contacts to your
          child&apos;s profile. Authorised provider staff can view this information
          to support safe sessions. Update details promptly if anything changes.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="attendance" title="Attendance and collection">
        <p>
          Providers use digital registers to track who is present. Follow their
          drop-off and collection procedures — including password or ID checks if
          required. Never share your account login with others.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="photos" title="Photos and communications">
        <p>
          Providers set their own photography and messaging policies. Activora
          messaging is logged for accountability. Contact the provider directly if
          you have concerns about how your child&apos;s information is used.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="concerns" title="Raising concerns">
        <p>
          For safeguarding concerns during an activity, contact the provider
          immediately and follow their procedures. For platform-related issues,{" "}
          <Link href="/contact" className="font-semibold text-teal-700 dark:text-teal-400">
            contact Activora support
          </Link>
          . Read our{" "}
          <Link href="/trust/safeguarding" className="font-semibold text-teal-700 dark:text-teal-400">
            Safeguarding
          </Link>{" "}
          page for more detail.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
