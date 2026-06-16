import type { Metadata } from "next";
import { FaqPage } from "@/components/help/FaqPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Help Centre — FAQ",
  description: `Find answers about bookings, payments, registers, and more on ${BRAND_NAME}. Search our FAQ or chat with support.`,
};

export default function HelpFaqPage() {
  return <FaqPage />;
}
