"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/club/PageHeader";
import { SectionSkeleton } from "@/components/ui/SectionSkeleton";
import { FINANCE_TABS } from "@/lib/club-finance/tabs";
import type { FinanceTab } from "@/lib/club-finance/types";

const FinanceOverviewSection = dynamic(
  () =>
    import("./FinanceOverviewSection").then((m) => m.FinanceOverviewSection),
  { loading: () => <SectionSkeleton /> },
);
const FinanceTransactionsSection = dynamic(
  () =>
    import("./FinanceTransactionsSection").then(
      (m) => m.FinanceTransactionsSection,
    ),
  { loading: () => <SectionSkeleton rows={6} /> },
);
const FinancePayoutsSection = dynamic(
  () => import("./FinancePayoutsSection").then((m) => m.FinancePayoutsSection),
  { loading: () => <SectionSkeleton rows={5} /> },
);
const FinanceFailedPaymentsSection = dynamic(
  () =>
    import("./FinanceFailedPaymentsSection").then(
      (m) => m.FinanceFailedPaymentsSection,
    ),
  { loading: () => <SectionSkeleton rows={4} /> },
);
const FinanceRefundsSection = dynamic(
  () => import("./FinanceRefundsSection").then((m) => m.FinanceRefundsSection),
  { loading: () => <SectionSkeleton rows={4} /> },
);
const FinanceFeeHandlingSection = dynamic(
  () =>
    import("./FinanceFeeHandlingSection").then((m) => m.FinanceFeeHandlingSection),
  { loading: () => <SectionSkeleton rows={3} /> },
);
const PaymentProvidersSection = dynamic(
  () =>
    import("./PaymentProvidersSection").then((m) => m.PaymentProvidersSection),
  { loading: () => <SectionSkeleton rows={5} />, ssr: false },
);
const FinanceInvoicesSection = dynamic(
  () => import("./FinanceInvoicesSection").then((m) => m.FinanceInvoicesSection),
  { loading: () => <SectionSkeleton rows={5} /> },
);
const FinanceVatSection = dynamic(
  () => import("./FinanceVatSection").then((m) => m.FinanceVatSection),
  { loading: () => <SectionSkeleton rows={4} /> },
);
const FinanceAccountantSection = dynamic(
  () =>
    import("./FinanceAccountantSection").then((m) => m.FinanceAccountantSection),
  { loading: () => <SectionSkeleton rows={4} /> },
);
const FinanceIntegrationsSection = dynamic(
  () =>
    import("./FinanceIntegrationsSection").then(
      (m) => m.FinanceIntegrationsSection,
    ),
  { loading: () => <SectionSkeleton rows={4} />, ssr: false },
);
const FinanceReportsSection = dynamic(
  () => import("./FinanceReportsSection").then((m) => m.FinanceReportsSection),
  { loading: () => <SectionSkeleton rows={4} /> },
);

const VALID_TABS = new Set<string>(FINANCE_TABS.map((t) => t.id));

function isFinanceTab(value: string | null): value is FinanceTab {
  if (value === "stripe") {
    return true;
  }
  return value !== null && VALID_TABS.has(value);
}

function resolveFinanceTab(value: string | null): FinanceTab {
  if (value === "stripe") {
    return "payment-providers";
  }
  return isFinanceTab(value) ? value : "overview";
}

export function FinancePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<FinanceTab>(
    resolveFinanceTab(tabParam),
  );

  useEffect(() => {
    setActiveTab(resolveFinanceTab(tabParam));
  }, [tabParam]);

  const setTab = useCallback((tab: FinanceTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "overview") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tab);
    }
    window.history.replaceState({}, "", url.toString());
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Revenue, transactions, payouts, fees, refunds, and accounting integrations — all in one place."
      />

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <nav
          className="inline-flex min-w-full gap-1 rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-sm sm:min-w-0"
          aria-label="Finance sections"
        >
          {FINANCE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "overview" ? <FinanceOverviewSection /> : null}
      {activeTab === "transactions" ? <FinanceTransactionsSection /> : null}
      {activeTab === "payouts" ? <FinancePayoutsSection /> : null}
      {activeTab === "failed-payments" ? (
        <FinanceFailedPaymentsSection />
      ) : null}
      {activeTab === "refunds" ? <FinanceRefundsSection /> : null}
      {activeTab === "fees" ? <FinanceFeeHandlingSection /> : null}
      {activeTab === "payment-providers" ? <PaymentProvidersSection /> : null}
      {activeTab === "invoices" ? <FinanceInvoicesSection /> : null}
      {activeTab === "vat" ? <FinanceVatSection /> : null}
      {activeTab === "accountant" ? <FinanceAccountantSection /> : null}
      {activeTab === "integrations" ? <FinanceIntegrationsSection /> : null}
      {activeTab === "reports" ? <FinanceReportsSection /> : null}
    </div>
  );
}
