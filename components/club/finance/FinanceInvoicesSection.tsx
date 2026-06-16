"use client";

import { useState } from "react";
import {
  formatFinanceShortDate,
  MONTHLY_INVOICES,
  type MonthlyInvoice,
} from "@/lib/club-finance";
import { formatMoney } from "@/lib/payments";
import {
  FinanceButton,
  FinanceEmptyState,
  FinanceSection,
  FinanceTableWrap,
  stubExportCsv,
} from "./shared";
import { VatBreakdownPanel } from "./VatBreakdownPanel";

export function FinanceInvoicesSection() {
  const [selectedId, setSelectedId] = useState(MONTHLY_INVOICES[0]?.id ?? "");

  const selected =
    MONTHLY_INVOICES.find((inv) => inv.id === selectedId) ??
    MONTHLY_INVOICES[0] ??
    null;

  return (
    <div className="space-y-6">
      <FinanceSection
        title="Monthly invoices"
        description="Monthly statements explaining what your club earned, which fees were deducted, where money was paid, and when."
        action={
          selected ? (
            <FinanceButton
              variant="secondary"
              onClick={stubExportCsv(
                `activora-invoice-${selected.periodLabel.replace(/\s/g, "-").toLowerCase()}.pdf`,
              )}
            >
              Download PDF
            </FinanceButton>
          ) : null
        }
      >
        {MONTHLY_INVOICES.length === 0 ? (
          <FinanceEmptyState
            title="No invoices yet"
            description="Monthly invoices are generated at the end of each billing period once bookings are processed."
          />
        ) : (
          <div className="space-y-6">
            <label className="block max-w-xs">
              <span className="mb-1 block text-xs font-medium text-zinc-500">
                Statement period
              </span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                {MONTHLY_INVOICES.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.periodLabel}
                  </option>
                ))}
              </select>
            </label>

            {selected ? <InvoiceSummary invoice={selected} /> : null}
          </div>
        )}
      </FinanceSection>

      {selected && selected.lineItems.length > 0 ? (
        <FinanceSection
          title="Booking detail"
          description="References, activities, venues, and payout dates for this statement."
        >
          <FinanceTableWrap>
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 pr-4">Activity</th>
                <th className="pb-3 pr-4">Venue</th>
                <th className="pb-3 pr-4 text-right">Gross</th>
                <th className="pb-3 pr-4 text-right">Fees</th>
                <th className="pb-3 pr-4 text-right">Net payout</th>
                <th className="pb-3 pr-4">Paid</th>
                <th className="pb-3">Payout date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {selected.lineItems.map((item) => (
                <tr key={item.bookingReference} className="text-zinc-700">
                  <td className="py-3.5 pr-4 font-mono text-xs">
                    {item.bookingReference}
                  </td>
                  <td className="py-3.5 pr-4">{item.activityName}</td>
                  <td className="py-3.5 pr-4 text-sm text-zinc-500">
                    {item.venue}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-medium">
                    {formatMoney(item.grossAmount)}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-zinc-500">
                    {formatMoney(item.platformFee + item.stripeFee)}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-semibold">
                    {formatMoney(item.netPayout)}
                  </td>
                  <td className="py-3.5 pr-4 whitespace-nowrap text-zinc-500">
                    {formatFinanceShortDate(item.paymentDate)}
                  </td>
                  <td className="py-3.5 whitespace-nowrap text-zinc-500">
                    {item.payoutDate
                      ? formatFinanceShortDate(item.payoutDate)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </FinanceTableWrap>
        </FinanceSection>
      ) : null}
    </div>
  );
}

function InvoiceSummary({ invoice }: { invoice: MonthlyInvoice }) {
  const vatBreakdown = {
    vatEnabled: invoice.vatAmount > 0,
    netAmount: invoice.vatNet,
    vatAmount: invoice.vatAmount,
    grossAmount: invoice.grossRevenue,
    vatRatePercent: 20,
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/80 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Monthly statement
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-zinc-900">
            {invoice.periodLabel}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {formatFinanceShortDate(invoice.periodStart)} –{" "}
            {formatFinanceShortDate(invoice.periodEnd)}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium text-zinc-500">Payout destination</p>
          <p className="mt-1 font-semibold text-zinc-900">
            {invoice.payoutDestination}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Payout dates:{" "}
            {invoice.payoutDates
              .map((d) => formatFinanceShortDate(d))
              .join(", ")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem
          label="Total sales"
          value={formatMoney(invoice.totalSales)}
          hint="Through Activora"
        />
        <SummaryItem
          label="Total bookings"
          value={String(invoice.totalBookings)}
          hint="Completed in period"
        />
        <SummaryItem
          label="Gross revenue"
          value={formatMoney(invoice.grossRevenue)}
        />
        <SummaryItem
          label="Net paid out"
          value={formatMoney(invoice.netPaidOut)}
          emphasis
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-100 bg-white p-4">
          <h4 className="text-sm font-semibold text-zinc-900">Fee deductions</h4>
          <dl className="mt-3 space-y-2 text-sm">
            <FeeRow label="Platform fees" value={invoice.platformFees} />
            <FeeRow label="Stripe / processing fees" value={invoice.stripeFees} />
            <FeeRow label="Refunds" value={invoice.refunds} negative />
          </dl>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-4">
          <h4 className="text-sm font-semibold text-zinc-900">
            Revenue breakdown
          </h4>
          <div className="mt-3">
            <VatBreakdownPanel breakdown={vatBreakdown} />
          </div>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-zinc-400">
        This statement summarises how much your club earned through Activora,
        what fees were deducted, where funds were paid, and when payouts were
        made. Booking references, activity names, and venue names are listed in
        the detail table below.
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p
        className={`mt-1 ${emphasis ? "text-xl font-bold text-teal-700" : "text-lg font-semibold text-zinc-900"}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function FeeRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd
        className={`font-medium ${negative ? "text-rose-600" : "text-zinc-900"}`}
      >
        {negative ? "−" : ""}
        {formatMoney(value)}
      </dd>
    </div>
  );
}
