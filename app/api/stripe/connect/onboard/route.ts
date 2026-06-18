import { NextResponse } from "next/server";
import {
  getProviderStripeAccountId,
  persistProviderStripeConnect,
} from "@/lib/stripe-connect/provider-persistence";
import {
  createExpressConnectAccount,
  createOnboardingLink,
} from "@/lib/stripe/connect";
import { STRIPE_PLATFORM_NAME } from "@/lib/stripe/constants";
import {
  buildStripeConnectErrorResponse,
  getStripeConnectClubMessage,
  type StripeConnectErrorCode,
} from "@/lib/stripe/errors";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe/server";

type OnboardBody = {
  providerId?: string;
  stripeAccountId?: string | null;
  refresh?: boolean;
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    const code: StripeConnectErrorCode = "not_configured";
    return NextResponse.json(
      {
        error: getStripeConnectClubMessage(
          new Error("Stripe is not configured. Add STRIPE_SECRET_KEY."),
        ),
        code,
        ...(process.env.NODE_ENV !== "production"
          ? {
              adminDetail:
                "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local and restart the dev server.",
            }
          : {}),
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as OnboardBody;
    const stripe = getStripe();
    const providerId = body.providerId?.trim() || "demo-provider-1";
    const baseUrl = getAppBaseUrl(request);
    const returnUrl = `${baseUrl}/club/finance?tab=stripe&stripe=complete`;
    const refreshUrl = `${baseUrl}/club/finance?tab=stripe&stripe=refresh`;

    let accountId =
      body.stripeAccountId?.trim() ||
      (await getProviderStripeAccountId(providerId)) ||
      null;

    if (!accountId) {
      const account = await createExpressConnectAccount(stripe, providerId);
      accountId = account.id;
      await persistProviderStripeConnect(providerId, account);
    } else {
      const account = await stripe.accounts.retrieve(accountId);
      await persistProviderStripeConnect(providerId, account);
    }

    const url = await createOnboardingLink(
      stripe,
      accountId,
      returnUrl,
      refreshUrl,
    );

    return NextResponse.json({
      url,
      stripeAccountId: accountId,
      refresh: Boolean(body.refresh),
      platform: STRIPE_PLATFORM_NAME,
    });
  } catch (error) {
    const payload = buildStripeConnectErrorResponse(error, {
      route: "/api/stripe/connect/onboard",
    });
    const status =
      payload.code === "platform_unavailable" || payload.code === "not_configured"
        ? 503
        : 500;

    return NextResponse.json(payload, { status });
  }
}
