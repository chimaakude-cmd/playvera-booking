import type { StripeConnectStatus } from "@/lib/stripe-connect/types";
import type { GoCardlessConnectionStatus } from "@/lib/gocardless/types";

export type PreferredPaymentProvider = "stripe" | "gocardless";

/** Club-wide default when an activity uses "club default". */
export type ClubDefaultPaymentProvider = "stripe" | "gocardless";

/** Per-activity override in the session wizard. */
export type ActivityPaymentProvider =
  | "club_default"
  | "stripe"
  | "gocardless"
  | "activora_managed"
  | "both";

export type PaymentMethodId =
  | "stripe_card"
  | "gocardless_direct_debit"
  | "manual_invoice";

export type PaymentProviderSettings = {
  provider_id: string;
  stripe_status: StripeConnectStatus;
  gocardless_status: GoCardlessConnectionStatus;
  preferred_payment_provider: PreferredPaymentProvider;
  club_default_provider: ClubDefaultPaymentProvider;
  enabled_methods: Record<PaymentMethodId, boolean>;
  updated_at: string;
};

export const PAYMENT_PROVIDERS_STORAGE_KEY = "activora-payment-providers";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, string> = {
  stripe_card: "Stripe",
  gocardless_direct_debit: "GoCardless",
  manual_invoice: "Manual invoice / BACS later",
};

export const PAYMENT_METHOD_DESCRIPTIONS: Record<PaymentMethodId, string> = {
  stripe_card: "Instant card payments when Stripe Connect is connected.",
  gocardless_direct_debit:
    "UK Direct Debit through your connected GoCardless account.",
  manual_invoice: "Send invoices and collect BACS payments outside Activora.",
};

export const CLUB_DEFAULT_PAYMENT_PROVIDER_OPTIONS: Array<{
  value: ClubDefaultPaymentProvider;
  label: string;
  description: string;
}> = [
  {
    value: "stripe",
    label: "Stripe",
    description: "Cards, Apple Pay, Google Pay",
  },
  {
    value: "gocardless",
    label: "GoCardless",
    description: "Direct Debit, lower processing cost",
  },
];

export const ACTIVITY_PAYMENT_PROVIDER_OPTIONS: Array<{
  value: ActivityPaymentProvider;
  label: string;
  description: string;
  example?: string;
}> = [
  {
    value: "club_default",
    label: "Use club default",
    description: "Follow your club payment settings",
  },
  {
    value: "stripe",
    label: "Stripe",
    description: "Card checkout only",
    example: "Holiday camp",
  },
  {
    value: "gocardless",
    label: "GoCardless",
    description: "Direct Debit through your connected GoCardless account",
    example: "Monthly subscription",
  },
  {
    value: "both",
    label: "Accept both",
    description: "Parents see every method enabled for this activity",
    example: "Flexible bookings",
  },
];

export const ACTIVITY_PAYMENT_PROVIDER_BADGES: Record<
  "stripe" | "gocardless",
  string
> = {
  stripe: "Card payments",
  gocardless: "Direct Debit",
};

export function getActivityPaymentProviderLabel(
  provider: ActivityPaymentProvider,
  clubDefault: ClubDefaultPaymentProvider = "stripe",
): string {
  if (provider === "club_default") {
    return clubDefault === "gocardless" ? "Club default (GoCardless)" : "Club default (Stripe)";
  }

  if (provider === "activora_managed") {
    return "Activora Managed (Direct Debit)";
  }

  if (provider === "both") {
    return "Stripe + GoCardless";
  }

  return provider === "gocardless" ? "GoCardless" : "Stripe";
}
