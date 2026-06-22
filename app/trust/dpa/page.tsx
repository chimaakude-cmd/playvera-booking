import type { Metadata } from "next";
import { DpaTrustPage } from "@/components/trust/DpaTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description: `${BRAND_NAME} DPA — controller, processor roles, data ownership and sub-processors.`,
};

export default function TrustDpaPage() {
  return <DpaTrustPage />;
}
