import { AdminActivitiesSection } from "@/components/admin/AdminActivitiesSection";
import {
  fetchAdminActivitiesList,
  fetchAdminActivityProviders,
} from "@/lib/admin/activities-data";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  const [{ activities, dataSource }, providers] = await Promise.all([
    fetchAdminActivitiesList(),
    fetchAdminActivityProviders(),
  ]);

  return (
    <AdminActivitiesSection
      activities={activities}
      providers={providers}
      dataSource={dataSource}
    />
  );
}
