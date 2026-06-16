import { DEFAULT_PLAN_ID, normalizePlanId, type PlanId } from "@/src/config/pricing";
import { DEMO_PROVIDER_ID } from "@/lib/stripe-connect/types";
import type { ProviderSubscriptionRecord, ProviderSubscriptionStatus } from "./types";
import { PROVIDER_SUBSCRIPTIONS_STORAGE_KEY } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createDefaultRecord(providerId: string): ProviderSubscriptionRecord {
  return {
    providerId,
    plan: DEFAULT_PLAN_ID,
    gocardlessCustomerId: null,
    mandateId: null,
    subscriptionId: null,
    status: "none",
    nextBillingDate: null,
    updatedAt: new Date().toISOString(),
  };
}

export function getProviderSubscriptionRecord(
  providerId?: string,
): ProviderSubscriptionRecord {
  const id = providerId ?? DEMO_PROVIDER_ID;

  if (!isBrowser()) {
    return createDefaultRecord(id);
  }

  try {
    const raw = localStorage.getItem(PROVIDER_SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) {
      return createDefaultRecord(id);
    }

    const parsed = JSON.parse(raw) as ProviderSubscriptionRecord;
    if (parsed.providerId !== id) {
      return createDefaultRecord(id);
    }

    return {
      ...createDefaultRecord(id),
      ...parsed,
      plan: normalizePlanId(parsed.plan),
    };
  } catch {
    return createDefaultRecord(id);
  }
}

export function saveProviderSubscriptionRecord(
  record: ProviderSubscriptionRecord,
): ProviderSubscriptionRecord {
  const next: ProviderSubscriptionRecord = {
    ...record,
    plan: normalizePlanId(record.plan),
    updatedAt: new Date().toISOString(),
  };

  if (isBrowser()) {
    localStorage.setItem(PROVIDER_SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export function updateProviderSubscriptionRecord(
  providerId: string,
  updates: Partial<Omit<ProviderSubscriptionRecord, "providerId">>,
): ProviderSubscriptionRecord {
  const current = getProviderSubscriptionRecord(providerId);
  return saveProviderSubscriptionRecord({
    ...current,
    ...updates,
    providerId,
  });
}

export function clearProviderSubscriptionBilling(
  providerId?: string,
): ProviderSubscriptionRecord {
  const id = providerId ?? DEMO_PROVIDER_ID;
  return saveProviderSubscriptionRecord({
    ...createDefaultRecord(id),
    plan: DEFAULT_PLAN_ID,
    status: "none",
  });
}

export function mapGoCardlessSubscriptionStatus(
  gcStatus: string,
): ProviderSubscriptionStatus {
  switch (gcStatus) {
    case "active":
      return "active";
    case "cancelled":
    case "finished":
      return "cancelled";
    case "customer_approval_denied":
    case "paused":
      return "payment_failed";
    default:
      return "pending_mandate";
  }
}

export function applySubscriptionFromApi(
  providerId: string,
  data: {
    plan: PlanId;
    gocardlessCustomerId: string | null;
    mandateId: string | null;
    subscriptionId: string | null;
    status: ProviderSubscriptionStatus;
    nextBillingDate: string | null;
  },
): ProviderSubscriptionRecord {
  return saveProviderSubscriptionRecord({
    providerId,
    plan: data.plan,
    gocardlessCustomerId: data.gocardlessCustomerId,
    mandateId: data.mandateId,
    subscriptionId: data.subscriptionId,
    status: data.status,
    nextBillingDate: data.nextBillingDate,
    updatedAt: new Date().toISOString(),
  });
}
