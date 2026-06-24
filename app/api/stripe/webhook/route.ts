import { NextResponse } from "next/server";
import { mapStripeAccountToState } from "@/lib/stripe/connect";
import { getResolvedStripeEnv } from "@/lib/stripe/platform-admin/resolve";
import { recordStripeWebhookReceived } from "@/lib/stripe/platform-admin";
import {
  getStripe,
  isStripeConfiguredAsync,
} from "@/lib/stripe/server";
import { validateStripeWebhookSecret } from "@/lib/stripe/env";
import {
  markSubscriptionInvoicePaid,
  markSubscriptionPaymentFailed,
  syncSubscriptionFromStripe,
} from "@/lib/session-subscriptions/server-store";
import type Stripe from "stripe";

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
    .subscription;
  if (typeof legacy === "string") {
    return legacy;
  }
  if (legacy && typeof legacy === "object") {
    return legacy.id;
  }
  return null;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const pendingBookingId =
    session.metadata?.pendingBookingId ?? session.metadata?.pending_booking_id;

  if (pendingBookingId) {
    const { confirmPendingBooking } = await import(
      "@/lib/booking-checkout/server-store"
    );
    confirmPendingBooking(pendingBookingId);
  }

  const checkoutMode = session.metadata?.checkoutMode;
  if (checkoutMode === "subscription" && session.subscription) {
    const stripe = await getStripe();
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscriptionFromStripe(subscription, session);
  }
}

export async function POST(request: Request) {
  if (!(await isStripeConfiguredAsync())) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 503 },
    );
  }

  const resolved = await getResolvedStripeEnv();
  const stripe = await getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = resolved.webhookSecret;

  if (!signature || !webhookSecret || !validateStripeWebhookSecret(webhookSecret).valid) {
    return NextResponse.json(
      { error: "Missing Stripe webhook signature or secret." },
      { status: 400 },
    );
  }

  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    await recordStripeWebhookReceived();

    if (event.type === "account.updated") {
      const account = event.data.object;
      const state = mapStripeAccountToState(account);
      const providerId = account.metadata?.provider_id?.trim();
      if (providerId) {
        const { persistProviderStripeConnect } = await import(
          "@/lib/stripe-connect/provider-persistence"
        );
        await persistProviderStripeConnect(providerId, account);
      }
      return NextResponse.json({ received: true, state });
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event.data.object);
      return NextResponse.json({ received: true, type: event.type });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      await syncSubscriptionFromStripe(event.data.object);
      return NextResponse.json({ received: true, type: event.type });
    }

    if (event.type === "customer.subscription.deleted") {
      await syncSubscriptionFromStripe(event.data.object);
      return NextResponse.json({ received: true, type: event.type });
    }

    if (event.type === "invoice.paid") {
      await markSubscriptionInvoicePaid(event.data.object);
      return NextResponse.json({ received: true, type: event.type });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (subscriptionId) {
        await markSubscriptionPaymentFailed(subscriptionId);
      }
      return NextResponse.json({ received: true, type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
