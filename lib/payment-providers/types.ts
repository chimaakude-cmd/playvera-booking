import type { StripeConnectStatus } from "@/lib/stripe-connect/types";
import type { GoCardlessConnectionStatus } from "@/lib/gocardless/types";

export type PreferredPaymentProvider = "stripe" | "gocardless";

export type PaymentMethodId =
  | "stripe_card"
  | "gocardless_direct_debit"
  | "manual_invoice";

export type PaymentProviderSettings = {
  provider_id: string;
  stripe_status: StripeConnectStatus;
  gocardless_status: GoCardlessConnectionStatus;
  preferred_payment_provider: PreferredPaymentProvider;
  enabled_methods: Record<PaymentMethodId, boolean>;
  updated_at: string;
};

export const PAYMENT_PROVIDERS_STORAGE_KEY = "activora-payment-providers";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, string> = {
  stripe_card: "Card payments via Stripe",
  gocardless_direct_debit: "Direct Debit via GoCardless",
  manual_invoice: "Manual invoice / BACS later",
};

export const PAYMENT_METHOD_DESCRIPTIONS: Record<PaymentMethodId, string> = {
  stripe_card: "Instant card payments when Stripe Connect is connected.",
  gocardless_direct_debit:
    "UK Direct Debit for subscriptions and recurring plans when GoCardless is connected.",
  manual_invoice: "Send invoices and collect BACS payments outside Activora.",
};
