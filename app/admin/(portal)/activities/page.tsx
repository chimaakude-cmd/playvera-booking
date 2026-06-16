import { AdminActivitiesSection } from "@/components/admin/AdminActivitiesSection";
import { fetchAdminActivitiesList } from "@/lib/admin/activities-data";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  const { activities, dataSource } = await fetchAdminActivitiesList();

  return (
    <AdminActivitiesSection activities={activities} dataSource={dataSource} />
  );
}
