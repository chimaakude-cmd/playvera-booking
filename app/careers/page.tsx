import type { Metadata } from "next";
import { CareersPage } from "@/components/careers/CareersPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Careers",
  description: `Join ${BRAND_NAME} and help us build the future of bookings for clubs, schools and families. View open roles and apply online.`,
};

export default function CareersRoutePage() {
  return <CareersPage />;
}
