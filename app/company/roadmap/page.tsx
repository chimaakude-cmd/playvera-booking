import type { Metadata } from "next";
import { CompanyRoadmapPage } from "@/components/trust/CompanyRoadmapPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Roadmap",
  description: `${BRAND_NAME} product roadmap — upcoming features and priorities.`,
};

export default function CompanyRoadmapRoutePage() {
  return <CompanyRoadmapPage />;
}
