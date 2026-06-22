import type { Metadata } from "next";
import { ProviderIntegrationsPage } from "@/components/pricing/ProviderIntegrationsPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Integrations",
  description: `${BRAND_NAME} integrations — Stripe, GoCardless, exports and upcoming connections.`,
};

export default function ProvidersIntegrationsPage() {
  return <ProviderIntegrationsPage />;
}
