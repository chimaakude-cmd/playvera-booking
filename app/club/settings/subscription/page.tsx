import { SubscriptionManagementSection } from "@/components/club/subscription/SubscriptionManagementSection";
import { PageHeader } from "@/components/club/PageHeader";
import { Suspense } from "react";

export default function ClubSubscriptionSettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Subscription & billing"
        description="View your plan, Direct Debit billing, and upgrade options."
      />
      <Suspense fallback={<div className="py-8 text-sm text-zinc-500">Loading billing…</div>}>
        <SubscriptionManagementSection />
      </Suspense>
    </div>
  );
}
