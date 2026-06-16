"use client";

import { useEffect, useState } from "react";
import {
  calculatePaymentBreakdown,
  getFranchisorFeeSettings,
} from "@/lib/finance-payouts";
import { formatMoney } from "@/lib/payments";

const SAMPLE_PAYMENT = 50;

type PaymentBreakdownPreviewProps = {
  customerPayment?: number;
};

export function PaymentBreakdownPreview({
  customerPayment = SAMPLE_PAYMENT,
}: PaymentBreakdownPreviewProps) {
  const [breakdown, setBreakdown] = useState(() =>
    calculatePaymentBreakdown(
      customerPayment,
      getFranchisorFeeSettings(),
    ),
  );

  useEffect(() => {
    setBreakdown(
      calculatePaymentBreakdown(
        customerPayment,
        getFranchisorFeeSettings(),
      ),
    );
  }, [customerPayment]);

  const steps = [
    {
      label: "Customer payment",
      value: breakdown.customerPayment,
      type: "start" as const,
    },
    {
      label: "Stripe processing fee",
      value: -breakdown.stripeFee,
      type: "deduction" as const,
    },
    {
      label: "Activora platform fee (2%)",
      value: -breakdown.activeoraFee,
      type: "deduction" as const,
    },
    {
      label: "Franchisor fee",
      value: -breakdown.franchisorFee,
      type: "deduction" as const,
    },
    {
      label: "Franchisee payout",
      value: breakdown.franchiseePayout,
      type: "result" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Example breakdown for a {formatMoney(customerPayment)} booking. Stripe and
        Activora fees are deducted first; franchisor fee is retained by your
        organisation before the franchisee payout.
      </p>

      <div className="max-w-lg space-y-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-3">
            {index > 0 ? (
              <span className="w-6 text-center text-xs text-zinc-400">↓</span>
            ) : (
              <span className="w-6" />
            )}
            <div
              className={`flex flex-1 items-center justify-between rounded-xl border px-4 py-3 ${
                step.type === "result"
                  ? "border-emerald-200 bg-emerald-50"
                  : step.type === "start"
                    ? "border-zinc-200 bg-white"
                    : "border-zinc-100 bg-zinc-50"
              }`}
            >
              <span
                className={`text-sm ${
                  step.type === "result"
                    ? "font-semibold text-emerald-900"
                    : "text-zinc-600"
                }`}
              >
                {step.type === "deduction" ? "− " : step.type === "result" ? "= " : ""}
                {step.label}
              </span>
              <span
                className={`text-sm font-semibold ${
                  step.type === "result"
                    ? "text-emerald-800"
                    : step.type === "deduction"
                      ? "text-rose-600"
                      : "text-zinc-900"
                }`}
              >
                {formatMoney(Math.abs(step.value))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
