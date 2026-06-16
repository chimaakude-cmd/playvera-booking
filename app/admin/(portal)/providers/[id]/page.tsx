import { AdminProviderDetailSection } from "@/components/admin/AdminProviderDetailSection";

export default async function AdminProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProviderDetailSection providerId={id} />;
}
