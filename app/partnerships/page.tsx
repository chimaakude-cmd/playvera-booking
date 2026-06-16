import type { Metadata } from "next";
import { PartnershipsPage } from "@/components/partnerships/PartnershipsPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Partnerships",
  description: `Partner with ${BRAND_NAME} to support clubs, providers, staff and children. Explore partnership opportunities and arrange a conversation with our team.`,
};

export default function PartnershipsRoutePage() {
  return <PartnershipsPage />;
}
