"use client";

import dynamic from "next/dynamic";
import { SectionSkeleton } from "@/components/ui/SectionSkeleton";

const AdminFinanceSection = dynamic(
  () =>
    import("@/components/admin/AdminFinanceSection").then(
      (m) => m.AdminFinanceSection,
    ),
  { loading: () => <SectionSkeleton rows={6} /> },
);

export default function AdminFinancePage() {
  return <AdminFinanceSection />;
}
