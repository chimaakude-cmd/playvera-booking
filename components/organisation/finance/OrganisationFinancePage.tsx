"use client";

import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { FranchisorFeeSettingsForm } from "./FranchisorFeeSettingsForm";
import { FinanceReportsTable } from "./FinanceReportsTable";
import { PaymentBreakdownPreview } from "./PaymentBreakdownPreview";
import { PayoutScheduleForm } from "./PayoutScheduleForm";

function FinanceSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function OrganisationFinancePage() {
  const [breakdownKey, setBreakdownKey] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Configure franchisee payout schedules, franchisor fees, and review group revenue reports."
      />

      <FinanceSection
        title="Franchisee payout schedule"
        description="Set when franchisee clubs receive their net payouts after the hold period."
      >
        <PayoutScheduleForm />
      </FinanceSection>

      <FinanceSection
        title="Franchisor fee settings"
        description="Fees retained by your organisation on top of Activora and Stripe charges."
      >
        <FranchisorFeeSettingsForm
          onSaved={() => setBreakdownKey((k) => k + 1)}
        />
      </FinanceSection>

      <FinanceSection
        title="Payment breakdown preview"
        description="See how a single booking is split between Stripe, Activora, your organisation, and the franchisee."
      >
        <PaymentBreakdownPreview key={breakdownKey} />
      </FinanceSection>

      <FinanceSection
        title="Finance reports"
        description="Group payout summaries across all franchisee clubs."
      >
        <FinanceReportsTable />
      </FinanceSection>
    </div>
  );
}
