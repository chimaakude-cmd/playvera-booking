/**
 * Stripe Connect types and status mapping.
 */

export type StripeConnectStatus =
  | "not_connected"
  | "action_required"
  | "connected"
  | "restricted"
  | "payouts_enabled";

export type StripeConnectDashboard = {
  payoutSchedule: string | null;
  availableBalance: number;
  pendingBalance: number;
  lastPayoutAmount: number | null;
  lastPayoutDate: string | null;
  verificationStatus: string;
  currency: string;
};

export type StripeConnectState = {
  providerId: string;
  stripeAccountId: string | null;
  status: StripeConnectStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  disabledReason: string | null;
  requirementsDue: string[];
  dashboard: StripeConnectDashboard | null;
  updatedAt: string;
};

export const STRIPE_CONNECT_STATUS_LABELS: Record<StripeConnectStatus, string> =
  {
    not_connected: "Not connected",
    action_required: "Action required",
    connected: "Connected",
    restricted: "Restricted",
    payouts_enabled: "Payouts enabled",
  };

export const STRIPE_CONNECT_STORAGE_KEY = "activora-stripe-connect";

export const DEMO_PROVIDER_ID = "demo-provider-1";

export function isStripeConnected(status: StripeConnectStatus): boolean {
  return status === "connected" || status === "payouts_enabled";
}

export function isStripePayoutReady(status: StripeConnectStatus): boolean {
  return status === "payouts_enabled" || status === "connected";
}

/** Bookkeeping unlocks when Stripe status is Connected or Payouts enabled. */
export function canUseBookkeepingIntegrations(
  status: StripeConnectStatus,
): boolean {
  return isStripeConnected(status);
}
