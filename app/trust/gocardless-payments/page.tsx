import type { Metadata } from "next";
import { GoCardlessPaymentsTrustPage } from "@/components/trust/GoCardlessPaymentsTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "GoCardless Payments",
  description: `How ${BRAND_NAME} uses GoCardless Direct Debit for secure bank payments. Platform fees, processing estimates and provider payouts explained.`,
  openGraph: {
    title: `GoCardless Payments – ${BRAND_NAME}`,
    description:
      "Direct Debit payments on Activora — how mandates work, fee estimates and what providers receive.",
    type: "website",
  },
  alternates: {
    canonical: "/trust/gocardless-payments",
  },
};

export default function GoCardlessPaymentsRoutePage() {
  return <GoCardlessPaymentsTrustPage />;
}
