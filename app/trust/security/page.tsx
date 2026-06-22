import type { Metadata } from "next";
import { TrustSecurityContentPage } from "@/components/trust/TrustSecurityContentPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Data Storage & Security",
  description: `How ${BRAND_NAME} protects data with encryption, access controls, backups and monitoring.`,
};

export default function TrustSecurityPage() {
  return <TrustSecurityContentPage />;
}
