import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import gocardless, { Environments, type GoCardlessClient } from "gocardless-nodejs";
import { getGoCardlessEnv } from "@/lib/gocardless/env";
import { getPlanByIdOrDefault, type PlanId } from "@/src/config/pricing";

export type GoCardlessCustomerResult = {
  id: string;
  mock: boolean;
};

export type GoCardlessMandateSetupResult = {
  redirectFlowId: string;
  redirectUrl: string;
  sessionToken: string;
  mock: boolean;
};

export type GoCardlessMandateCompleteResult = {
  mandateId: string;
  customerId: string;
  mock: boolean;
};

export type GoCardlessSubscriptionResult = {
  id: string;
  status: string;
  nextBillingDate: string | null;
  mock: boolean;
};

function mockResourceId(prefix: string): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

function getClient(): GoCardlessClient | null {
  const env = getGoCardlessEnv();
  if (!env.accessToken) {
    return null;
  }

  const environment =
    env.environment === "live" ? Environments.Live : Environments.Sandbox;

  return gocardless(env.accessToken, environment);
}

export function isGoCardlessPaymentsConfigured(): boolean {
  return getGoCardlessEnv().isConfigured;
}

export async function createCustomer(params: {
  email: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
}): Promise<GoCardlessCustomerResult> {
  const client = getClient();
  if (!client) {
    if (!isDevelopmentEnvironment()) {
      throw new Error("GoCardless is not configured.");
    }
    return { id: mockResourceId("CU"), mock: true };
  }

  const customer = await client.customers.create({
    email: params.email,
    given_name: params.givenName,
    family_name: params.familyName,
    company_name: params.companyName,
  });

  return { id: customer.id!, mock: false };
}

/**
 * Starts a GoCardless redirect flow so the provider can authorise a Direct Debit mandate.
 */
export async function createMandate(params: {
  customerId: string;
  sessionToken: string;
  successRedirectUrl: string;
  description?: string;
}): Promise<GoCardlessMandateSetupResult> {
  const client = getClient();
  if (!client) {
    if (!isDevelopmentEnvironment()) {
      throw new Error("GoCardless is not configured.");
    }
    const redirectFlowId = mockResourceId("RF");
    const baseUrl = params.successRedirectUrl.split("?")[0] ?? params.successRedirectUrl;
    const redirectUrl = `${baseUrl}?mock_gocardless=1&redirect_flow_id=${redirectFlowId}&session_token=${encodeURIComponent(params.sessionToken)}`;

    return {
      redirectFlowId,
      redirectUrl,
      sessionToken: params.sessionToken,
      mock: true,
    };
  }

  const flow = await client.redirectFlows.create(
    {
      session_token: params.sessionToken,
      success_redirect_url: params.successRedirectUrl,
      description:
        params.description ?? "Activora subscription — Direct Debit mandate",
      links: { customer: params.customerId },
    } as Parameters<typeof client.redirectFlows.create>[0],
  );

  return {
    redirectFlowId: flow.id!,
    redirectUrl: flow.redirect_url!,
    sessionToken: params.sessionToken,
    mock: false,
  };
}

export async function completeMandate(params: {
  redirectFlowId: string;
  sessionToken: string;
}): Promise<GoCardlessMandateCompleteResult> {
  const client = getClient();
  if (!client) {
    if (!isDevelopmentEnvironment()) {
      throw new Error("GoCardless is not configured.");
    }
    return {
      mandateId: mockResourceId("MD"),
      customerId: mockResourceId("CU"),
      mock: true,
    };
  }

  const flow = await client.redirectFlows.complete(params.redirectFlowId, {
    session_token: params.sessionToken,
  });

  return {
    mandateId: flow.links!.mandate!,
    customerId: flow.links!.customer!,
    mock: false,
  };
}

export function subscriptionAmountPence(planId: PlanId): number {
  const plan = getPlanByIdOrDefault(planId);
  return Math.round(plan.monthlyPrice * 100);
}

export async function createSubscription(params: {
  mandateId: string;
  planId: PlanId;
  name?: string;
}): Promise<GoCardlessSubscriptionResult> {
  const client = getClient();
  const plan = getPlanByIdOrDefault(params.planId);
  const amount = subscriptionAmountPence(params.planId);

  if (!client) {
    if (!isDevelopmentEnvironment()) {
      throw new Error("GoCardless is not configured.");
    }
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      id: mockResourceId("SB"),
      status: "active",
      nextBillingDate: nextMonth.toISOString().slice(0, 10),
      mock: true,
    };
  }

  const subscription = await client.subscriptions.create({
    amount: String(amount),
    currency: "GBP",
    interval_unit: "monthly",
    links: { mandate: params.mandateId },
    name: params.name ?? `Activora ${plan.id} plan`,
    metadata: { plan_id: params.planId },
  });

  return {
    id: subscription.id!,
    status: subscription.status!,
    nextBillingDate: subscription.upcoming_payments?.[0]?.charge_date ?? null,
    mock: false,
  };
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<{ status: string; mock: boolean }> {
  const client = getClient();
  if (!client) {
    if (!isDevelopmentEnvironment()) {
      throw new Error("GoCardless is not configured.");
    }
    return { status: "cancelled", mock: true };
  }

  const result = await client.subscriptions.cancel(subscriptionId);
  return { status: result.status!, mock: false };
}

export async function getSubscriptionStatus(
  subscriptionId: string,
): Promise<GoCardlessSubscriptionResult> {
  const client = getClient();
  if (!client) {
    if (!isDevelopmentEnvironment()) {
      throw new Error("GoCardless is not configured.");
    }
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      id: subscriptionId,
      status: "active",
      nextBillingDate: nextMonth.toISOString().slice(0, 10),
      mock: true,
    };
  }

  const subscription = await client.subscriptions.find(subscriptionId);
  return {
    id: subscription.id!,
    status: subscription.status!,
    nextBillingDate: subscription.upcoming_payments?.[0]?.charge_date ?? null,
    mock: false,
  };
}
