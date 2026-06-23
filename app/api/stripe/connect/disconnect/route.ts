import { NextResponse } from "next/server";
import { getStripe, isStripeConfiguredAsync } from "@/lib/stripe/server";

type DisconnectBody = {
  providerId?: string;
  stripeAccountId?: string;
};

export async function POST(request: Request) {
  if (!(await isStripeConfiguredAsync())) {
    return NextResponse.json({ ok: true, disconnected: true });
  }

  try {
    const body = (await request.json()) as DisconnectBody;

    if (body.stripeAccountId) {
      const stripe = await getStripe();
      // Soft disconnect: client clears local state. Stripe account remains for audit.
      await stripe.accounts.update(body.stripeAccountId, {
        metadata: {
          activora_disconnected_at: new Date().toISOString(),
          provider_id: body.providerId ?? "demo-provider-1",
        },
      });
    }

    return NextResponse.json({ ok: true, disconnected: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not disconnect Stripe account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
