import type { Metadata } from "next";
import { TalentPoolPage } from "@/components/careers/TalentPoolPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Talent pool — Careers",
  description: `Join the ${BRAND_NAME} talent pool. Share your CV and we'll reach out when a matching role opens.`,
};

export default function TalentPoolRoutePage() {
  return <TalentPoolPage />;
}
