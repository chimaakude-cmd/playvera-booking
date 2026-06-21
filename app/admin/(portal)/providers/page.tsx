import { AdminProvidersSection } from "@/components/admin/AdminProvidersSection";
import { fetchAdminProvidersList } from "@/lib/admin/providers-data";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const { providers, byTab, dataSource, diagnostics } = await fetchAdminProvidersList();

  return (
    <AdminProvidersSection
      providers={providers}
      byTab={byTab}
      dataSource={dataSource}
      diagnostics={diagnostics}
    />
  );
}
