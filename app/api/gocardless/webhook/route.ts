import { NextResponse } from "next/server";
import { parse as parseGoCardlessWebhook } from "gocardless-nodejs/webhooks";
import { getGoCardlessEnv } from "@/lib/gocardless/env";
import { mapGoCardlessSubscriptionStatus } from "@/lib/provider-subscriptions/storage";
import {
  applyServerSubscriptionStatus,
  findProviderByMandateId,
  findProviderBySubscriptionId,
  updateServerProviderSubscription,
} from "@/lib/provider-subscriptions/server-store";
import { DEFAULT_PLAN_ID } from "@/src/config/pricing";

function handleSubscriptionEvent(
  action: string,
  subscriptionId: string | undefined,
): void {
  if (!subscriptionId) {
    return;
  }

  const record = findProviderBySubscriptionId(subscriptionId);
  if (!record) {
    return;
  }

  if (action === "cancelled" || action === "finished") {
    updateServerProviderSubscription(record.providerId, {
      plan: DEFAULT_PLAN_ID,
      status: "cancelled",
      subscriptionId: null,
      nextBillingDate: null,
    });
    return;
  }

  if (action === "payment_created") {
    applyServerSubscriptionStatus(record.providerId, "active");
    return;
  }

  if (action === "payment_failed") {
    applyServerSubscriptionStatus(record.providerId, "payment_failed");
  }
}

function handleMandateEvent(
  action: string,
  mandateId: string | undefined,
): void {
  if (!mandateId) {
    return;
  }

  const record = findProviderByMandateId(mandateId);
  if (!record) {
    return;
  }

  if (action === "cancelled" || action === "failed" || action === "expired") {
    updateServerProviderSubscription(record.providerId, {
      plan: DEFAULT_PLAN_ID,
      status: "cancelled",
      mandateId: null,
      subscriptionId: null,
      nextBillingDate: null,
    });
    return;
  }

  if (action === "active") {
    applyServerSubscriptionStatus(record.providerId, "active");
  }
}

export async function POST(request: Request) {
  const env = getGoCardlessEnv();
  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature");

  if (env.isConfigured && env.webhookSecret && signature) {
    try {
      const events = parseGoCardlessWebhook(
        rawBody,
        env.webhookSecret,
        signature,
      );

      for (const event of events) {
        const resourceType = event.resource_type;
        const action = event.action;
        if (!action) {
          continue;
        }

        const links = event.links as Record<string, string | undefined>;

        if (resourceType === "subscriptions") {
          handleSubscriptionEvent(action, links.subscriptions ?? links.subscription);
        }

        if (resourceType === "mandates") {
          handleMandateEvent(action, links.mandates ?? links.mandate);
        }

        if (resourceType === "payments" && action === "failed") {
          const subscriptionId = links.subscription;
          if (subscriptionId) {
            const record = findProviderBySubscriptionId(subscriptionId);
            if (record) {
              applyServerSubscriptionStatus(record.providerId, "payment_failed");
            }
          }
        }
      }

      return NextResponse.json({ received: true, mock: false, events: events.length });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Webhook verification failed.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({
    received: true,
    mock: true,
    message: "Webhook stub — configure GOCARDLESS_ACCESS_TOKEN and GOCARDLESS_WEBHOOK_SECRET.",
  });
}
