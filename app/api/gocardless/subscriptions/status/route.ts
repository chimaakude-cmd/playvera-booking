import { NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/payments/gocardless";
import { mapGoCardlessSubscriptionStatus } from "@/lib/provider-subscriptions/storage";
import {
  getServerProviderSubscription,
  saveServerProviderSubscription,
} from "@/lib/provider-subscriptions/server-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerId = url.searchParams.get("providerId")?.trim() || "demo-provider-1";
  const current = getServerProviderSubscription(providerId);

  if (!current.subscriptionId) {
    return NextResponse.json(current);
  }

  try {
    const live = await getSubscriptionStatus(current.subscriptionId);
    const record = saveServerProviderSubscription({
      ...current,
      status: mapGoCardlessSubscriptionStatus(live.status),
      nextBillingDate: live.nextBillingDate,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ...record, mock: live.mock });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not fetch subscription status.";
    return NextResponse.json({ error: message, ...current }, { status: 500 });
  }
}
