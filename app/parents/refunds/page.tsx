import type { Metadata } from "next";
import { ParentRefundsPage } from "@/components/trust/ParentRefundsPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refund policy for parents booking activities through ${BRAND_NAME}.`,
};

export default function ParentsRefundsPage() {
  return <ParentRefundsPage />;
}
