import { getGoCardlessConnection } from "@/lib/gocardless/storage";
import { isGoCardlessConnected } from "@/lib/gocardless/types";
import {
  isGoCardlessProviderConnected,
  resolveStripeConnectStatus,
} from "@/lib/providers/payment-schema";
import { getStripeConnectState } from "@/lib/stripe-connect/storage";
import type { StripeConnectState, StripeConnectStatus } from "@/lib/stripe-connect/types";
import { isStripeProviderConnected } from "./config";

/** Provider row / API fields used to derive payment setup readiness. */
export type PaymentSetupStatusInput = {
  stripe_account_id?: string | null;
  stripe_connect_status?: string | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  gocardless_status?: string | null;
  gocardless_merchant_id?: string | null;
};

export function isStripePaymentSetupReadyFromRow(
  row: PaymentSetupStatusInput | null | undefined,
): boolean {
  if (!row?.stripe_account_id?.trim()) {
    return false;
  }

  const status = resolveStripeConnectStatus(row) as StripeConnectStatus;
  if (!isStripeProviderConnected(status)) {
    return false;
  }

  return Boolean(row.stripe_charges_enabled) && Boolean(row.stripe_payouts_enabled);
}

export function isStripePaymentSetupReadyFromState(
  state: StripeConnectState | null | undefined,
): boolean {
  if (!state?.stripeAccountId?.trim()) {
    return false;
  }

  if (!isStripeProviderConnected(state.status)) {
    return false;
  }

  return state.chargesEnabled && state.payoutsEnabled;
}

export function isGoCardlessPaymentSetupReadyFromRow(
  row: PaymentSetupStatusInput | null | undefined,
): boolean {
  return isGoCardlessProviderConnected(row);
}

export function isGoCardlessPaymentSetupReady(
  status: string | null | undefined,
  merchantId?: string | null,
): boolean {
  return isGoCardlessConnected(
    (status ?? "not_connected") as Parameters<typeof isGoCardlessConnected>[0],
    merchantId,
  );
}

export function isPaymentSetupCompleteFromRow(
  row: PaymentSetupStatusInput | null | undefined,
): boolean {
  return (
    isStripePaymentSetupReadyFromRow(row) ||
    isGoCardlessPaymentSetupReadyFromRow(row)
  );
}

/** Client-side: true when Stripe or GoCardless is fully connected for paid activities. */
export function isPaymentSetupComplete(providerId?: string): boolean {
  const stripe = getStripeConnectState();
  const id = providerId ?? stripe.providerId;
  const gocardless = getGoCardlessConnection(id);

  return (
    isStripePaymentSetupReadyFromState(stripe) ||
    isGoCardlessPaymentSetupReady(gocardless.status, gocardless.merchant_id)
  );
}

export function describeActivePaymentProvider(
  providerId?: string,
): "stripe" | "gocardless" | null {
  if (isStripePaymentSetupReadyFromState(getStripeConnectState())) {
    return "stripe";
  }

  const stripe = getStripeConnectState();
  const id = providerId ?? stripe.providerId;
  const gocardless = getGoCardlessConnection(id);

  if (isGoCardlessPaymentSetupReady(gocardless.status, gocardless.merchant_id)) {
    return "gocardless";
  }

  return null;
}
