import { DEMO_PROVIDER_ID } from "@/lib/stripe-connect/types";
import type { PlanId } from "@/src/config/pricing";
import { setProviderSubscriptionPlan } from "@/lib/provider-subscription";
import {
  applySubscriptionFromApi,
  getProviderSubscriptionRecord,
} from "./storage";
import type { ProviderSubscriptionRecord, ProviderSubscriptionStatus } from "./types";

type SetupResponse = {
  redirectUrl: string;
  redirectFlowId: string;
  sessionToken: string;
  mock: boolean;
};

type SubscriptionApiRecord = {
  providerId: string;
  plan: PlanId;
  gocardlessCustomerId: string | null;
  mandateId: string | null;
  subscriptionId: string | null;
  status: ProviderSubscriptionStatus;
  nextBillingDate: string | null;
  mock?: boolean;
};

function syncLocalRecord(data: SubscriptionApiRecord): ProviderSubscriptionRecord {
  return applySubscriptionFromApi(data.providerId, {
    plan: data.plan,
    gocardlessCustomerId: data.gocardlessCustomerId,
    mandateId: data.mandateId,
    subscriptionId: data.subscriptionId,
    status: data.status,
    nextBillingDate: data.nextBillingDate,
  });
}

export async function startProviderSubscriptionSetup(params: {
  providerId?: string;
  planId: PlanId;
  email: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
}): Promise<SetupResponse> {
  const providerId = params.providerId ?? DEMO_PROVIDER_ID;

  const response = await fetch("/api/gocardless/subscriptions/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, providerId }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? "Could not start Direct Debit setup.");
  }

  const data = (await response.json()) as SetupResponse;
  applySubscriptionFromApi(providerId, {
    plan: params.planId,
    gocardlessCustomerId: null,
    mandateId: null,
    subscriptionId: null,
    status: "pending_mandate",
    nextBillingDate: null,
  });

  return data;
}

export async function completeProviderSubscriptionSetup(params: {
  providerId?: string;
  redirectFlowId: string;
  sessionToken: string;
}): Promise<ProviderSubscriptionRecord> {
  const providerId = params.providerId ?? DEMO_PROVIDER_ID;

  const response = await fetch("/api/gocardless/subscriptions/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, providerId }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? "Could not complete Direct Debit setup.");
  }

  const data = (await response.json()) as SubscriptionApiRecord;
  setProviderSubscriptionPlan(data.plan);
  return syncLocalRecord(data);
}

export async function cancelProviderSubscriptionBilling(
  providerId?: string,
): Promise<ProviderSubscriptionRecord> {
  const id = providerId ?? getProviderSubscriptionRecord().providerId;

  const response = await fetch("/api/gocardless/subscriptions/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId: id }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? "Could not cancel subscription.");
  }

  const data = (await response.json()) as SubscriptionApiRecord;
  setProviderSubscriptionPlan(data.plan);
  return syncLocalRecord(data);
}

export async function refreshProviderSubscriptionStatus(
  providerId?: string,
): Promise<ProviderSubscriptionRecord> {
  const id = providerId ?? getProviderSubscriptionRecord().providerId;

  try {
    const response = await fetch(
      `/api/gocardless/subscriptions/status?providerId=${encodeURIComponent(id)}`,
    );

    if (!response.ok) {
      return getProviderSubscriptionRecord(id);
    }

    const data = (await response.json()) as SubscriptionApiRecord;
    if (data.plan) {
      setProviderSubscriptionPlan(data.plan);
    }
    return syncLocalRecord(data);
  } catch {
    return getProviderSubscriptionRecord(id);
  }
}
