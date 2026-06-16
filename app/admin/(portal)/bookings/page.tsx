import { AdminBookingsSection } from "@/components/admin/AdminBookingsSection";
import { fetchAdminBookingsList } from "@/lib/admin/bookings-data";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const { bookings, dataSource } = await fetchAdminBookingsList();

  return <AdminBookingsSection bookings={bookings} dataSource={dataSource} />;
}
