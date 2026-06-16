import type { Metadata } from "next";
import { UpdatesPage } from "@/components/transparency/UpdatesPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "What's New",
  description: `Latest ${BRAND_NAME} releases, improvements and fixes. Current version and public changelog.`,
};

export default function UpdatesRoutePage() {
  return <UpdatesPage />;
}
