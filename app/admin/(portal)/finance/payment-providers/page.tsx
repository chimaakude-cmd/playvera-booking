import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Payment providers hub — GoCardless platform setup (Stripe remains on Finance overview). */
export default function AdminPaymentProvidersPage() {
  redirect("/admin/finance/payment-providers/gocardless");
}
