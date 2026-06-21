"use client";

import { FinanceSection } from "./shared";

/**
 * Safe fallback while unified payment-provider UI is disabled.
 * Must not throw when club/provider/payment records are missing.
 */
export function PaymentProvidersSection() {
  return (
    <FinanceSection
      title="Payment providers"
      description="How payments work for your club on Activora."
    >
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5">
        <p className="text-sm font-semibold text-zinc-900">
          Payments are managed by Activora
        </p>
        <ul className="mt-4 space-y-3 text-sm text-zinc-600">
          <li className="flex items-start gap-2">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
              aria-hidden
            />
            <span>GoCardless platform is connected</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300"
              aria-hidden
            />
            <span>Stripe is optional for instant card payments</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500"
              aria-hidden
            />
            <span>
              Paid activities can use the provider selected during activity
              setup
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500">
          Contact{" "}
          <a
            href="mailto:support@activora.uk?subject=Payment%20support"
            className="font-medium text-teal-700 hover:text-teal-800"
          >
            Activora support
          </a>{" "}
          if you need help with payouts or payment setup.
        </p>
      </div>
    </FinanceSection>
  );
}
