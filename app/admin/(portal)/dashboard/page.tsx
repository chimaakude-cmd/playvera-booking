import { AdminTestDashboardContent } from "@/components/admin/AdminTestDashboardContent";
import { fetchAdminDashboardData } from "@/lib/admin/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await fetchAdminDashboardData();

  return <AdminTestDashboardContent data={data} />;
}
