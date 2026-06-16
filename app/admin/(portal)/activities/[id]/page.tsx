import { AdminActivityDetailSection } from "@/components/admin/AdminActivityDetailSection";
import { fetchAdminActivityById } from "@/lib/admin/activities-data";

export const dynamic = "force-dynamic";

export default async function AdminActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await fetchAdminActivityById(id);

  return <AdminActivityDetailSection activity={activity} />;
}
