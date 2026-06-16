import { AdminFinanceSection } from "@/components/admin/AdminFinanceSection";
import { fetchAdminFinanceData } from "@/lib/admin/finance-data";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const data = await fetchAdminFinanceData();
  return <AdminFinanceSection data={data} />;
}
