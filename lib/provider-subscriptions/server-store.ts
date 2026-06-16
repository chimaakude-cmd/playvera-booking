import { normalizePlanId, type PlanId } from "@/src/config/pricing";
import type {
  PendingMandateSetup,
  ProviderSubscriptionRecord,
  ProviderSubscriptionStatus,
} from "./types";

/**
 * Server-side stub until Supabase provider_subscriptions is wired.
 * Webhooks and API routes read/write here; the client mirrors state in localStorage.
 */

const subscriptions = new Map<string, ProviderSubscriptionRecord>();
const pendingSetups = new Map<string, PendingMandateSetup>();

function defaultRecord(providerId: string): ProviderSubscriptionRecord {
  return {
    providerId,
    plan: "STARTER",
    gocardlessCustomerId: null,
    mandateId: null,
    subscriptionId: null,
    status: "none",
    nextBillingDate: null,
    updatedAt: new Date().toISOString(),
  };
}

export function getServerProviderSubscription(
  providerId: string,
): ProviderSubscriptionRecord {
  return subscriptions.get(providerId) ?? defaultRecord(providerId);
}

export function saveServerProviderSubscription(
  record: ProviderSubscriptionRecord,
): ProviderSubscriptionRecord {
  const next: ProviderSubscriptionRecord = {
    ...record,
    plan: normalizePlanId(record.plan),
    updatedAt: new Date().toISOString(),
  };
  subscriptions.set(record.providerId, next);
  return next;
}

export function updateServerProviderSubscription(
  providerId: string,
  updates: Partial<Omit<ProviderSubscriptionRecord, "providerId">>,
): ProviderSubscriptionRecord {
  const current = getServerProviderSubscription(providerId);
  return saveServerProviderSubscription({ ...current, ...updates, providerId });
}

export function savePendingMandateSetup(setup: PendingMandateSetup): void {
  pendingSetups.set(setup.providerId, setup);
}

export function getPendingMandateSetup(
  providerId: string,
): PendingMandateSetup | null {
  return pendingSetups.get(providerId) ?? null;
}

export function clearPendingMandateSetup(providerId: string): void {
  pendingSetups.delete(providerId);
}

export function findProviderBySubscriptionId(
  subscriptionId: string,
): ProviderSubscriptionRecord | null {
  for (const record of subscriptions.values()) {
    if (record.subscriptionId === subscriptionId) {
      return record;
    }
  }
  return null;
}

export function findProviderByMandateId(
  mandateId: string,
): ProviderSubscriptionRecord | null {
  for (const record of subscriptions.values()) {
    if (record.mandateId === mandateId) {
      return record;
    }
  }
  return null;
}

export function applyServerSubscriptionStatus(
  providerId: string,
  status: ProviderSubscriptionStatus,
  nextBillingDate?: string | null,
): ProviderSubscriptionRecord {
  return updateServerProviderSubscription(providerId, {
    status,
    nextBillingDate: nextBillingDate ?? null,
  });
}

export function applyServerSubscriptionPlan(
  providerId: string,
  planId: PlanId,
): ProviderSubscriptionRecord {
  return updateServerProviderSubscription(providerId, { plan: planId });
}
