"use client";

import Link from "next/link";
import { ClubPaymentProviderSelector } from "@/components/club/finance/ClubPaymentProviderSelector";
import { PageHeader } from "@/components/club/PageHeader";

export default function ClubPaymentSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Payment provider"
        description="Set your club default. Individual activities can override this in the session wizard."
      />

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Club default</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Activora manages GoCardless Direct Debit on your behalf — no separate
            GoCardless account required.
          </p>
        </div>

        <ClubPaymentProviderSelector />

        <Link
          href="/club/finance?tab=payment-providers"
          className="inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          View payment status in Finance →
        </Link>
      </section>
    </div>
  );
}
