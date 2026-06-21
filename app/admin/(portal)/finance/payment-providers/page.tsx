import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy route — GoCardless setup is embedded on /admin/finance. */
export default function AdminPaymentProvidersPage() {
  redirect("/admin/finance#gocardless-platform-setup");
}
