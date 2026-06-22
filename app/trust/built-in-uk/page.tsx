import type { Metadata } from "next";
import { BuiltInUkTrustPage } from "@/components/trust/BuiltInUkTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Built in the UK",
  description: `${BRAND_NAME} is UK-designed with local support for clubs, schools and activity providers.`,
};

export default function TrustBuiltInUkPage() {
  return <BuiltInUkTrustPage />;
}
