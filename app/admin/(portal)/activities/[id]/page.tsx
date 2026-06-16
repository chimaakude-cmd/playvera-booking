import { AdminActivityDetailSection } from "@/components/admin/AdminActivityDetailSection";

export default async function AdminActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminActivityDetailSection activityId={id} />;
}
