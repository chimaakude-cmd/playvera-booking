import type { Metadata } from "next";
import { FeatureRequestsPage } from "@/components/support/FeatureRequestsPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Feature requests",
  description: `Vote on ${BRAND_NAME} feature requests and suggest improvements.`,
};

export default function SupportFeatureRequestsPage() {
  return <FeatureRequestsPage />;
}
