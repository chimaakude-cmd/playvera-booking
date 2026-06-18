import { NextResponse } from "next/server";
import { mapStripeAccountToState } from "@/lib/stripe/connect";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
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
      const session = event.data.object;
      const pendingBookingId =
        session.metadata?.pendingBookingId ??
        session.metadata?.pending_booking_id;
      if (pendingBookingId) {
        const { confirmPendingBooking } = await import(
          "@/lib/booking-checkout/server-store"
        );
        confirmPendingBooking(pendingBookingId);
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
