import type { Metadata } from "next";
import { StripePaymentsTrustPage } from "@/components/trust/StripePaymentsTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Stripe Payments",
  description: `How ${BRAND_NAME} uses Stripe Connect for secure card payments. Platform fees, processing estimates and provider payouts explained.`,
  openGraph: {
    title: `Stripe Payments – ${BRAND_NAME}`,
    description:
      "Stripe Connect on Activora — how parent checkout works, fee estimates and what providers receive.",
    type: "website",
  },
  alternates: {
    canonical: "/trust/stripe-payments",
  },
};

export default function StripePaymentsRoutePage() {
  return <StripePaymentsTrustPage />;
}
