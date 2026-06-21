import { NextResponse } from "next/server";
import { parse as parseGoCardlessWebhook } from "gocardless-nodejs/webhooks";
import { handleGoCardlessBookingWebhookEvent } from "@/lib/gocardless/webhook-handlers";
import {
  appendGoCardlessPlatformLog,
  getResolvedGoCardlessEnv,
} from "@/lib/gocardless/platform-config";
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
  const env = await getResolvedGoCardlessEnv(request);
  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature");

  if (!env.isBillingConfigured) {
    return NextResponse.json(
      {
        received: false,
        mock: false,
        error: "GoCardless webhooks are not configured.",
      },
      { status: 503 },
    );
  }

  if (!env.webhookSecret?.trim()) {
    return NextResponse.json(
      {
        received: false,
        mock: false,
        error: "GoCardless webhook secret is not configured.",
      },
      { status: 503 },
    );
  }

  if (!signature) {
    await appendGoCardlessPlatformLog({
      level: "error",
      eventType: "webhook_verification_failed",
      message: "Webhook rejected — missing webhook-signature header.",
    });
    return NextResponse.json(
      { error: "Missing webhook-signature header." },
      { status: 401 },
    );
  }

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
        await handleGoCardlessBookingWebhookEvent({
          resourceType: "mandates",
          action,
          links,
        });
      }

      if (resourceType === "payments") {
        await handleGoCardlessBookingWebhookEvent({
          resourceType: "payments",
          action,
          links,
        });

        if (action === "failed") {
          const subscriptionId = links.subscription;
          if (subscriptionId) {
            const record = findProviderBySubscriptionId(subscriptionId);
            if (record) {
              applyServerSubscriptionStatus(record.providerId, "payment_failed");
            }
          }
        }
      }

      await appendGoCardlessPlatformLog({
        eventType: "webhook_received",
        message: `GoCardless webhook ${resourceType}.${action} processed.`,
        metadata: {
          resourceType,
          action,
          eventId: event.id ?? null,
        },
      });
    }

    return NextResponse.json({ received: true, mock: false, events: events.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook verification failed.";
    await appendGoCardlessPlatformLog({
      level: "error",
      eventType: "webhook_verification_failed",
      message,
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
