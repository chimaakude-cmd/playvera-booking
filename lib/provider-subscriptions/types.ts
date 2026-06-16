import type { PlanId } from "@/src/config/pricing";

/**
 * Provider platform subscription billed via GoCardless (Pro / Franchise).
 *
 * Storage (today): localStorage key `activora-provider-subscriptions`
 * Database (migration): public.provider_subscriptions
 */

export type ProviderSubscriptionStatus =
  | "none"
  | "pending_mandate"
  | "active"
  | "cancelled"
  | "payment_failed";

export type ProviderSubscriptionRecord = {
  providerId: string;
  plan: PlanId;
  gocardlessCustomerId: string | null;
  mandateId: string | null;
  subscriptionId: string | null;
  status: ProviderSubscriptionStatus;
  nextBillingDate: string | null;
  updatedAt: string;
};

export type PendingMandateSetup = {
  providerId: string;
  planId: PlanId;
  sessionToken: string;
  gocardlessCustomerId: string;
  createdAt: string;
};

export const PROVIDER_SUBSCRIPTIONS_STORAGE_KEY =
  "activora-provider-subscriptions";

export const PROVIDER_SUBSCRIPTION_STATUS_LABELS: Record<
  ProviderSubscriptionStatus,
  string
> = {
  none: "No subscription",
  pending_mandate: "Direct Debit setup in progress",
  active: "Active",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};
