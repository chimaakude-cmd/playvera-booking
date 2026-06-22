import type { Metadata } from "next";
import { CookiesTrustPage } from "@/components/trust/CookiesTrustPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `How ${BRAND_NAME} uses cookies and similar technologies.`,
};

export default function TrustCookiesPage() {
  return <CookiesTrustPage />;
}
