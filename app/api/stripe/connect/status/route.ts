import { NextResponse } from "next/server";
import { buildStripeConnectState } from "@/lib/stripe/connect";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export async function GET(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      { error: "accountId is required." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    const state = await buildStripeConnectState(stripe, account);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not retrieve Stripe account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
