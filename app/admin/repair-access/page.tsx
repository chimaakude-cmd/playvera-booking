import {
  AdminRepairAccessForm,
  AdminRepairAccessInvalid,
  AdminRepairAccessPageShell,
} from "@/components/admin/users/AdminRepairAccessPage";
import { validateRepairToken } from "@/lib/admin-users/emergency-access";

export const metadata = {
  title: "Repair admin access | Activora",
};

export default async function AdminRepairAccessRoute({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const valid = token.length > 0 && validateRepairToken(token);

  return (
    <AdminRepairAccessPageShell>
      {valid ? <AdminRepairAccessForm token={token} /> : <AdminRepairAccessInvalid />}
    </AdminRepairAccessPageShell>
  );
}
