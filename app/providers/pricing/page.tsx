import type { Metadata } from "next";
import { ProviderPricingPage } from "@/components/pricing/ProviderPricingPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Provider Pricing",
  description: `${BRAND_NAME} pricing for clubs and franchises — Free, Pro, Franchisor and Enterprise plans.`,
};

export default function ProvidersPricingPage() {
  return <ProviderPricingPage />;
}
