import { AdminSupportThreadsSection } from "@/components/admin/support/AdminSupportThreadsSection";
import { fetchAdminSupportThreads } from "@/lib/admin/support-data";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const { threads, dataSource } = await fetchAdminSupportThreads();
  return (
    <AdminSupportThreadsSection threads={threads} dataSource={dataSource} />
  );
}
