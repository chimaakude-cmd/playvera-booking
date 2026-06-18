import { NextResponse } from "next/server";
import { persistProviderStripeConnect } from "@/lib/stripe-connect/provider-persistence";
import { buildStripeConnectState } from "@/lib/stripe/connect";
import {
  buildStripeConnectErrorResponse,
  getStripeConnectClubMessage,
} from "@/lib/stripe/errors";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export async function GET(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: getStripeConnectClubMessage(
          new Error("Stripe is not configured. Add STRIPE_SECRET_KEY."),
        ),
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const providerId = searchParams.get("providerId")?.trim() || undefined;

  if (!accountId) {
    return NextResponse.json(
      { error: "accountId is required." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    const state = await buildStripeConnectState(
      stripe,
      account,
      providerId ?? account.metadata?.provider_id ?? "demo-provider-1",
    );

    const resolvedProviderId =
      providerId ?? account.metadata?.provider_id?.trim();
    if (resolvedProviderId) {
      await persistProviderStripeConnect(resolvedProviderId, account);
    }

    return NextResponse.json(state);
  } catch (error) {
    const payload = buildStripeConnectErrorResponse(error, {
      route: "/api/stripe/connect/status",
      accountId,
    });
    return NextResponse.json(payload, { status: 500 });
  }
}
