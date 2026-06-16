import { AdminProviderInviteSection } from "@/components/admin/AdminProviderInviteSection";
import { getProviderCreateAvailability } from "@/lib/admin/provider-create";

export const dynamic = "force-dynamic";

export default function AdminProviderInvitePage() {
  const dataSource = getProviderCreateAvailability();

  return <AdminProviderInviteSection dataSource={dataSource} />;
}
