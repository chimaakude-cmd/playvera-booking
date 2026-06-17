import {
  AdminRepairAccessForm,
  AdminRepairAccessInvalid,
  AdminRepairAccessPageShell,
  AdminRepairAccessUnavailable,
} from "@/components/admin/users/AdminRepairAccessPage";
import { validateRepairToken } from "@/lib/admin-users/emergency-access";
import { isAdminRepairEnabled } from "@/lib/admin-users/production-gates";

export const metadata = {
  title: "Repair admin access | Activora",
};

export default async function AdminRepairAccessRoute({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (!isAdminRepairEnabled()) {
    return (
      <AdminRepairAccessPageShell>
        <AdminRepairAccessUnavailable />
      </AdminRepairAccessPageShell>
    );
  }

  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const valid = token.length > 0 && validateRepairToken(token);

  return (
    <AdminRepairAccessPageShell>
      {valid ? <AdminRepairAccessForm token={token} /> : <AdminRepairAccessInvalid />}
    </AdminRepairAccessPageShell>
  );
}
