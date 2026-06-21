"use client";

import {
  ACCOUNTING_INTEGRATIONS,
  BOOKKEEPING_SYNC_ITEMS,
} from "@/lib/club-finance";
import {
  canUseBookkeepingIntegrations,
  STRIPE_CONNECT_STATUS_LABELS,
} from "@/lib/stripe-connect";
import { useStripeConnectStatus } from "@/lib/stripe-connect/use-stripe-connect-status";
import { BookkeepingLogo } from "./BookkeepingLogo";
import { FinanceButton, FinanceSection } from "./shared";

const SYNC_FIELDS = [
  "Booking reference",
  "Activity name",
  "Venue",
  "Customer name",
  "Child name",
  "Gross amount",
  "Net amount",
  "VAT amount",
  "Platform fee",
  "Stripe fee",
  "Payment date",
  "Payout date",
  "Source: Activora",
];

export function FinanceIntegrationsSection() {
  const { status: stripeStatus } = useStripeConnectStatus();

  const stripeReady = canUseBookkeepingIntegrations(stripeStatus);

  function handleConnect(name: string) {
    window.alert(
      `Connect ${name} will be available once bookkeeping OAuth is integrated. Stripe Connect is ready.`,
    );
  }

  return (
    <div className="space-y-6">
      {!stripeReady ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bookkeeping integrations are locked until Stripe is connected. Current
          status:{" "}
          <strong>{STRIPE_CONNECT_STATUS_LABELS[stripeStatus]}</strong>. Complete
          Stripe Connect under <strong>Payment providers</strong> first.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Stripe is connected. Bookkeeping Connect buttons are enabled — OAuth
          integrations will be wired next.
        </div>
      )}

      <FinanceSection
        title="Accounting integrations"
        description="Optional advanced feature — connect QuickBooks, FreeAgent, Xero, or Sage when you are ready."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {ACCOUNTING_INTEGRATIONS.map((integration) => (
            <article
              key={integration.id}
              className={`flex flex-col rounded-2xl border p-5 shadow-sm transition-shadow ${
                stripeReady
                  ? "border-zinc-200/80 bg-white hover:shadow-md"
                  : "border-zinc-200/60 bg-zinc-50 opacity-90"
              }`}
            >
              <div className="flex items-start gap-4">
                <BookkeepingLogo provider={integration.id} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-900">
                    {integration.name}
                  </h3>
                  <span className="mt-1 inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                    Not connected
                  </span>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-zinc-500">
                {integration.description}
              </p>
              <p className="mt-3 text-xs font-medium text-zinc-400">
                Future sync: {integration.syncItems.join(", ")}
              </p>
              <div className="mt-4">
                <FinanceButton
                  variant="secondary"
                  disabled={!stripeReady}
                  onClick={() => handleConnect(integration.name)}
                >
                  Connect
                </FinanceButton>
              </div>
            </article>
          ))}
        </div>
      </FinanceSection>

      <FinanceSection
        title="Future sync behaviour"
        description="When connected, Activora will automatically sync the following record types to your bookkeeping software."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {BOOKKEEPING_SYNC_ITEMS.map((item) => (
            <span
              key={item}
              className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SYNC_FIELDS.map((field) => (
            <div
              key={field}
              className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
            >
              {field}
            </div>
          ))}
        </div>
      </FinanceSection>
    </div>
  );
}
