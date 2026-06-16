import { AdminProvidersSection } from "@/components/admin/AdminProvidersSection";
import { fetchAdminProvidersList } from "@/lib/admin/providers-data";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const { providers, dataSource } = await fetchAdminProvidersList();

  return <AdminProvidersSection providers={providers} dataSource={dataSource} />;
}
