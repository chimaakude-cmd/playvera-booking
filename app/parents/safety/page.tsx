import type { Metadata } from "next";
import { ParentSafetyPage } from "@/components/trust/ParentSafetyPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Parent Safety",
  description: `Safety information for parents using ${BRAND_NAME} — medical details, attendance and verification.`,
};

export default function ParentsSafetyPage() {
  return <ParentSafetyPage />;
}
