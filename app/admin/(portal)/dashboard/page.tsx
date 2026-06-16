import { AdminTestDashboardContent } from "@/components/admin/AdminTestDashboardContent";
import { fetchAdminDashboardData } from "@/lib/admin/dashboard-data";

export const dynamic = "force-dynamic";

// TODO: Restore session gate and AdminOverview fallback before launch.
export default async function AdminDashboardPage() {
  const data = await fetchAdminDashboardData();

  return <AdminTestDashboardContent data={data} />;
}
