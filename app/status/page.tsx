import type { Metadata } from "next";
import { StatusPage } from "@/components/transparency/StatusPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "System Status",
  description: `Real-time availability and incident history for ${BRAND_NAME} services.`,
};

export default function StatusRoutePage() {
  return <StatusPage />;
}
