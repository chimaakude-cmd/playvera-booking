import type { Metadata } from "next";
import { PartnerDirectoryPage } from "@/components/partners/PartnerDirectoryPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Partner Directory",
  description: `Discover trusted partners helping ${BRAND_NAME} clubs grow, save money, support staff, and increase children's participation. Equipment, insurance, training, venues and more.`,
  openGraph: {
    title: `Activora Partner Directory | ${BRAND_NAME}`,
    description:
      "Exclusive offers and trusted organisations for activity providers and clubs across the UK.",
  },
};

export default function PartnersRoutePage() {
  return <PartnerDirectoryPage />;
}
