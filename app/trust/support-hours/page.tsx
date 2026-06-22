import type { Metadata } from "next";
import { SupportHoursTrustPage } from "@/components/trust/SupportHoursTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Support hours",
  description: `${BRAND_NAME} support hours and response targets for Critical, High and Normal requests.`,
};

export default function TrustSupportHoursPage() {
  return <SupportHoursTrustPage />;
}
