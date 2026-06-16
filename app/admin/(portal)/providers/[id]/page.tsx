import { AdminProviderDetailSection } from "@/components/admin/AdminProviderDetailSection";
import { fetchAdminProviderById } from "@/lib/admin/providers-data";

export const dynamic = "force-dynamic";

export default async function AdminProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await fetchAdminProviderById(id);

  return <AdminProviderDetailSection provider={provider} />;
}
