"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function TrustSecurityContentPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Trust"
      title="Data Storage & Security"
      subtitle="How Activora protects personal data, payments and platform infrastructure."
    >
      <TrustLegalSection id="encryption" title="Encryption">
        <p>
          All data in transit is protected with TLS 1.2 or higher. Sensitive fields
          — including payment references and authentication tokens — are encrypted
          at rest within our database and storage systems.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="access-controls" title="Access controls">
        <p>
          Staff access follows the principle of least privilege. Provider teams use
          role-based permissions so coaches, admins and finance users see only what
          they need. Admin actions are logged for audit purposes.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="backups" title="Backups and recovery">
        <p>
          Production databases are backed up continuously with point-in-time
          recovery. We test restore procedures regularly and maintain disaster
          recovery plans for critical platform services.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="monitoring" title="Monitoring">
        <p>
          Infrastructure is monitored around the clock for availability, errors and
          unusual activity. Security alerts are triaged according to severity with
          defined response procedures.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="audit-logs" title="Audit logs">
        <p>
          Key actions — including login events, permission changes, refunds and
          data exports — are recorded with timestamps and actor identity where
          applicable. Enterprise customers may request audit log access as part of
          their agreement.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="infrastructure" title="Infrastructure">
        <p>
          Activora runs on modern cloud infrastructure with automatic security
          patching, network isolation and DDoS protection. Data is stored in
          reputable EU/UK data centres where available for the service.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="account-protection" title="Account protection">
        <p>
          We support secure password policies, session timeouts and optional
          two-factor authentication for staff accounts. Parents and providers
          should use unique, strong passwords and report suspicious activity
          immediately.
        </p>
        <p>
          To report a security vulnerability, visit our{" "}
          <Link href="/security" className="font-semibold text-teal-700 dark:text-teal-400">
            Security page
          </Link>{" "}
          for responsible disclosure contact details.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
