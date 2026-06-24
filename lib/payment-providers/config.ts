import type { GoCardlessConnectionStatus } from "@/lib/gocardless/types";
import type { StripeConnectStatus } from "@/lib/stripe-connect/types";

/** Extend this union when adding a third payment provider. */
export type PaymentProviderId = "stripe" | "gocardless";

export type PaymentProviderDefinition = {
  id: PaymentProviderId;
  name: string;
  paymentType: string;
  tagline: string;
  description: string;
  bestFor: string[];
  brandColor: string;
  brandInitial: string;
  /** Shown on provider cards — e.g. GoCardless subscription use cases. */
  supportedUseCases?: string[];
};

export const PAYMENT_PROVIDER_DEFINITIONS: Record<
  PaymentProviderId,
  PaymentProviderDefinition
> = {
  stripe: {
    id: "stripe",
    name: "Stripe Connect",
    paymentType: "Card payments",
    tagline: "Recommended for instant card payments",
    description:
      "Connect Stripe for instant card payments at checkout. Payouts go directly to your club bank account.",
    bestFor: [
      "One-off activity bookings",
      "Instant confirmation at checkout",
      "Cards, Apple Pay, and Google Pay",
    ],
    brandColor: "#635BFF",
    brandInitial: "S",
  },
  gocardless: {
    id: "gocardless",
    name: "GoCardless",
    paymentType: "Direct Debit",
    tagline: "Useful for subscriptions, recurring payments, and clubs preferring DD",
    description:
      "Connect your GoCardless account to receive payouts directly. Collect UK Direct Debit for memberships, term fees, and recurring plans.",
    bestFor: [
      "Membership subscriptions",
      "Recurring monthly fees",
      "Block payment plans",
      "Clubs that prefer Direct Debit",
    ],
    supportedUseCases: [
      "Subscriptions",
      "Recurring monthly",
      "Block payment plans",
      "Direct Debit",
    ],
    brandColor: "#1B2A4E",
    brandInitial: "GC",
  },
};

export const PAYMENT_PROVIDER_ORDER: PaymentProviderId[] = [
  "stripe",
  "gocardless",
];

export function getStripeConnectionLabel(status: StripeConnectStatus): string {
  if (status === "not_connected") return "Not connected";
  if (status === "action_required" || status === "restricted") {
    return "Action required";
  }
  return "Connected";
}

export function getGoCardlessConnectionLabel(
  status: GoCardlessConnectionStatus,
): string {
  if (status === "not_connected" || status === "disconnected") {
    return "Not connected";
  }
  if (status === "pending_setup") {
    return "Under review";
  }
  if (status === "action_required") {
    return "Action required";
  }
  return "Connected";
}

export function isStripeProviderConnected(status: StripeConnectStatus): boolean {
  return status === "connected" || status === "payouts_enabled";
}
