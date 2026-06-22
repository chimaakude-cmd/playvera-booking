import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "GDPR & Privacy",
  description: `${BRAND_NAME} privacy policy and GDPR compliance information.`,
};

export default function TrustGdprPage() {
  redirect("/privacy");
}
