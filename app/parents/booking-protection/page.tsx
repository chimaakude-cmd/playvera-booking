import type { Metadata } from "next";
import { ParentBookingProtectionPage } from "@/components/trust/ParentBookingProtectionPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Booking Protection",
  description: `Booking protection for ${BRAND_NAME} parents — cancellations, reschedules and waiting lists.`,
};

export default function ParentsBookingProtectionPage() {
  return <ParentBookingProtectionPage />;
}
