import { NextResponse } from "next/server";
import {
  completeMandate,
  createSubscription,
} from "@/lib/payments/gocardless";
import { mapGoCardlessSubscriptionStatus } from "@/lib/provider-subscriptions/storage";
import {
  clearPendingMandateSetup,
  getPendingMandateSetup,
  saveServerProviderSubscription,
} from "@/lib/provider-subscriptions/server-store";
import type { ProviderSubscriptionStatus } from "@/lib/provider-subscriptions/types";

type CompleteBody = {
  providerId?: string;
  redirectFlowId?: string;
  sessionToken?: string;
};

export async function POST(request: Request) {
  let body: CompleteBody;

  try {
    body = (await request.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const providerId = body.providerId?.trim() || "demo-provider-1";
  const redirectFlowId = body.redirectFlowId?.trim();
  const sessionToken = body.sessionToken?.trim();

  if (!redirectFlowId || !sessionToken) {
    return NextResponse.json(
      { error: "redirectFlowId and sessionToken are required." },
      { status: 400 },
    );
  }

  const pending = getPendingMandateSetup(providerId);
  if (!pending || pending.sessionToken !== sessionToken) {
    return NextResponse.json(
      { error: "Direct Debit setup session expired. Please start again." },
      { status: 400 },
    );
  }

  try {
    const mandate = await completeMandate({ redirectFlowId, sessionToken });
    const subscription = await createSubscription({
      mandateId: mandate.mandateId,
      planId: pending.planId,
    });

    const status: ProviderSubscriptionStatus = mapGoCardlessSubscriptionStatus(
      subscription.status,
    );

    const record = saveServerProviderSubscription({
      providerId,
      plan: pending.planId,
      gocardlessCustomerId: mandate.customerId,
      mandateId: mandate.mandateId,
      subscriptionId: subscription.id,
      status,
      nextBillingDate: subscription.nextBillingDate,
      updatedAt: new Date().toISOString(),
    });

    clearPendingMandateSetup(providerId);

    return NextResponse.json({
      ...record,
      mock: mandate.mock || subscription.mock,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not complete Direct Debit setup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
