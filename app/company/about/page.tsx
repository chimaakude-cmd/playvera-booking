import type { Metadata } from "next";
import { CompanyAboutPage } from "@/components/trust/CompanyAboutPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About Activora",
  description: `About ${BRAND_NAME} — our mission to simplify activity bookings for UK clubs and families.`,
};

export default function CompanyAboutRoutePage() {
  return <CompanyAboutPage />;
}
