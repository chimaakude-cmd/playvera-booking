import type { Metadata } from "next";
import { SupportHoursPage } from "@/components/info/SupportHoursPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Support hours",
  description: `${BRAND_NAME} support hours and response times. We aim to reply within one working day.`,
};

export default function SupportHoursRoutePage() {
  return <SupportHoursPage />;
}
