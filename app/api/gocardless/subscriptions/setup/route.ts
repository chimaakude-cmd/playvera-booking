import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/stripe/server";
import {
  createCustomer,
  createMandate,
} from "@/lib/payments/gocardless";
import {
  getServerProviderSubscription,
  savePendingMandateSetup,
  saveServerProviderSubscription,
} from "@/lib/provider-subscriptions/server-store";
import {
  normalizePlanId,
  planRequiresGoCardlessBilling,
  type PlanId,
} from "@/src/config/pricing";

type SetupBody = {
  providerId?: string;
  planId?: PlanId | string;
  email?: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
};

export async function POST(request: Request) {
  let body: SetupBody;

  try {
    body = (await request.json()) as SetupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const providerId = body.providerId?.trim() || "demo-provider-1";
  const planId = normalizePlanId(body.planId);

  if (!planRequiresGoCardlessBilling(planId)) {
    return NextResponse.json(
      { error: "This plan does not require GoCardless billing." },
      { status: 400 },
    );
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: "A billing email address is required." },
      { status: 400 },
    );
  }

  const sessionToken = randomUUID();
  const baseUrl = getAppBaseUrl(request);
  const successRedirectUrl = `${baseUrl}/club/settings/subscription?gocardless=complete&providerId=${encodeURIComponent(providerId)}`;

  try {
    const customer = await createCustomer({
      email,
      givenName: body.givenName,
      familyName: body.familyName,
      companyName: body.companyName,
    });

    savePendingMandateSetup({
      providerId,
      planId,
      sessionToken,
      gocardlessCustomerId: customer.id,
      createdAt: new Date().toISOString(),
    });

    const mandate = await createMandate({
      customerId: customer.id,
      sessionToken,
      successRedirectUrl,
      description: `Activora ${planId} subscription — Direct Debit mandate`,
    });

    const current = getServerProviderSubscription(providerId);
    saveServerProviderSubscription({
      ...current,
      providerId,
      plan: planId,
      gocardlessCustomerId: customer.id,
      mandateId: null,
      subscriptionId: null,
      status: "pending_mandate",
      nextBillingDate: null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      redirectUrl: mandate.redirectUrl,
      redirectFlowId: mandate.redirectFlowId,
      sessionToken: mandate.sessionToken,
      mock: customer.mock || mandate.mock,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GoCardless setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
