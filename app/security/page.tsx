import type { Metadata } from "next";
import { SecurityPage } from "@/components/transparency/SecurityPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Security",
  description: `How ${BRAND_NAME} protects payments, data and accounts. Report security issues responsibly.`,
};

export default function SecurityRoutePage() {
  return <SecurityPage />;
}
