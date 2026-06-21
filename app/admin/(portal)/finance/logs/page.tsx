import { AdminPaymentEventLogSection } from "@/components/admin/finance/AdminPaymentEventLogSection";
import { PageHeader } from "@/components/club/PageHeader";

export default function AdminFinanceLogsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment logs"
        description="GoCardless payment events across all clubs — live database records only."
      />
      <AdminPaymentEventLogSection />
    </div>
  );
}
