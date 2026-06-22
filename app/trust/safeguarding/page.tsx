import type { Metadata } from "next";
import { SafeguardingTrustPage } from "@/components/trust/SafeguardingTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Safeguarding",
  description: `${BRAND_NAME} safeguarding — child protection, DBS, medical information and incident reporting.`,
};

export default function TrustSafeguardingPage() {
  return <SafeguardingTrustPage />;
}
