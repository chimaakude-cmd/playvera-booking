import type { Metadata } from "next";
import { PrivacyPage } from "@/components/privacy/PrivacyPage";
import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
} from "@/constants/privacy";

export const metadata: Metadata = {
  title: {
    absolute: "Privacy Policy – Activora",
  },
  description:
    "Activora Privacy Policy. How we collect, use and protect personal data for parents, children and activity providers under UK GDPR.",
  openGraph: {
    title: "Privacy Policy – Activora",
    description:
      "How Activora handles personal data for bookings, payments and club management under UK GDPR.",
    type: "website",
  },
  alternates: {
    canonical: "/privacy",
  },
  other: {
    "privacy-policy-version": PRIVACY_POLICY_VERSION,
    "privacy-policy-effective-date": PRIVACY_POLICY_EFFECTIVE_DATE,
  },
};

export default function PrivacyRoutePage() {
  return <PrivacyPage />;
}
