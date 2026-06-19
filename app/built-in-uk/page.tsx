import type { Metadata } from "next";
import { BuiltInUkPage } from "@/components/info/BuiltInUkPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Built in the UK",
  description: `${BRAND_NAME} is built and managed in the UK by a team passionate about making activity bookings easier for clubs and families.`,
};

export default function BuiltInUkRoutePage() {
  return <BuiltInUkPage />;
}
