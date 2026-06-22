"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function SafeguardingTrustPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Trust"
      title="Safeguarding"
      subtitle="How Activora supports child protection, provider responsibilities and incident reporting."
    >
      <TrustLegalSection id="commitment" title="Our commitment">
        <p>
          Activora is built for children&apos;s activities. Safeguarding is central
          to how we design registers, parent communications, staff permissions and
          data handling. Providers remain responsible for on-the-ground child
          protection — we provide tools and guidance to support that duty.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="child-protection" title="Child protection">
        <p>
          Providers must comply with UK safeguarding legislation and their
          governing body requirements. Activora supports emergency contact fields,
          medical notes, attendance registers and restricted staff access so
          sensitive information is shared only with authorised personnel.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="medical" title="Medical and allergy information">
        <p>
          Parents can record medical conditions, allergies and medication requirements
          on child profiles. This information is visible to authorised provider staff
          for session planning. Providers should verify details at enrolment and
          keep records up to date.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="photos" title="Photos and media">
        <p>
          Providers set their own photography and social media policies. Activora
          does not publicly publish child photos without provider control. We
          recommend explicit consent for marketing use and clear opt-out options for
          parents.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="dbs" title="DBS and staff verification">
        <p>
          Providers are responsible for ensuring staff and volunteers hold
          appropriate DBS checks and qualifications. Activora team management tools
          help assign roles and track who can access registers and child data — but
          verification of credentials remains the provider&apos;s obligation.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="incidents" title="Incident reporting">
        <p>
          If a safeguarding concern arises during an activity, providers must follow
          their local authority and governing body procedures. Activora support can
          assist with account access, data preservation and communication logs if
          needed for investigations. Report urgent platform-related concerns via{" "}
          <Link href="/contact" className="font-semibold text-teal-700 dark:text-teal-400">
            Contact
          </Link>
          .
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="provider-responsibilities" title="Provider responsibilities">
        <p>
          By using Activora, providers confirm they will maintain appropriate
          safeguarding policies, train staff, and use platform features responsibly.
          We may suspend accounts that pose a safeguarding risk or breach our terms.
        </p>
        <p>
          Parents should read our{" "}
          <Link href="/parents/safety" className="font-semibold text-teal-700 dark:text-teal-400">
            Parent Safety
          </Link>{" "}
          page for guidance on what to expect from providers.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
