import { AdminTestDashboardContent } from "@/components/admin/AdminTestDashboardContent";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { hasTestAdminSession } from "@/lib/auth/test-admin-session";

export default async function AdminDashboardPage() {
  const isTestAdmin = await hasTestAdminSession();

  if (isTestAdmin) {
    return <AdminTestDashboardContent />;
  }

  return <AdminOverview />;
}
