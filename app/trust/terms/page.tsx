import type { Metadata } from "next";
import { TermsTrustPage } from "@/components/trust/TermsTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${BRAND_NAME} — activity providers, parents and platform users.`,
};

export default function TrustTermsPage() {
  return <TermsTrustPage />;
}
