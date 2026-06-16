import { NextResponse } from "next/server";
import { cancelSubscription } from "@/lib/payments/gocardless";
import {
  getServerProviderSubscription,
  saveServerProviderSubscription,
} from "@/lib/provider-subscriptions/server-store";
import { DEFAULT_PLAN_ID } from "@/src/config/pricing";

type CancelBody = {
  providerId?: string;
};

export async function POST(request: Request) {
  let body: CancelBody;

  try {
    body = (await request.json()) as CancelBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const providerId = body.providerId?.trim() || "demo-provider-1";
  const current = getServerProviderSubscription(providerId);

  if (!current.subscriptionId) {
    return NextResponse.json(
      { error: "No active GoCardless subscription to cancel." },
      { status: 400 },
    );
  }

  try {
    await cancelSubscription(current.subscriptionId);

    const record = saveServerProviderSubscription({
      ...current,
      plan: DEFAULT_PLAN_ID,
      status: "cancelled",
      subscriptionId: null,
      nextBillingDate: null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(record);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not cancel subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
