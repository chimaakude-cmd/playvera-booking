import { AdminStripeSetupSection } from "@/components/admin/finance/AdminStripeSetupSection";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stripe setup | Activora Admin",
};

export default function AdminStripeSetupPage() {
  return <AdminStripeSetupSection />;
}
