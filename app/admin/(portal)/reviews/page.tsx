import { AdminReviewsSection } from "@/components/admin/reviews/AdminReviewsSection";
import { fetchAdminReviewsList } from "@/lib/admin/reviews-data";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const { reviews, dataSource } = await fetchAdminReviewsList();
  return <AdminReviewsSection reviews={reviews} dataSource={dataSource} />;
}
