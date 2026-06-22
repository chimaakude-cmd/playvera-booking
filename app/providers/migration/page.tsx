import type { Metadata } from "next";
import { ProviderMigrationPage } from "@/components/pricing/ProviderMigrationPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Migration support",
  description: `Migrate to ${BRAND_NAME} from ClassForKids, Pebble, Coacha or spreadsheets.`,
};

export default function ProvidersMigrationPage() {
  return <ProviderMigrationPage />;
}
