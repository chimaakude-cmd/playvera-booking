import type { Metadata } from "next";
import { SupportReleasesPage } from "@/components/support/SupportReleasesPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Release notes",
  description: `${BRAND_NAME} release notes and platform changelog.`,
};

export default function SupportReleasesRoutePage() {
  return <SupportReleasesPage />;
}
