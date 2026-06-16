import { AdminUserEditSection } from "@/components/admin/users/AdminUserEditSection";

type AdminUserEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserEditPage({ params }: AdminUserEditPageProps) {
  const { id } = await params;
  return <AdminUserEditSection userId={id} />;
}
