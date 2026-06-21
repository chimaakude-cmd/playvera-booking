import { SubscriptionPlansSection } from "@/components/admin/settings/SubscriptionPlansSection";
import { PageHeader } from "@/components/club/PageHeader";

export default function AdminPlansPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Plans"
        description="Commercial model — prices, limits, booking fees, and feature flags."
      />
      <SubscriptionPlansSection />
    </div>
  );
}
