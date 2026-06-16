import { NextResponse } from "next/server";
import {
  createExpressConnectAccount,
  createOnboardingLink,
} from "@/lib/stripe/connect";
import { STRIPE_PLATFORM_NAME } from "@/lib/stripe/constants";
import { getStripeConnectErrorMessage } from "@/lib/stripe/errors";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe/server";

type OnboardBody = {
  providerId?: string;
  stripeAccountId?: string | null;
  refresh?: boolean;
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as OnboardBody;
    const stripe = getStripe();
    const baseUrl = getAppBaseUrl(request);
    const returnUrl = `${baseUrl}/club/finance?tab=stripe&connected=1`;
    const refreshUrl = `${baseUrl}/club/finance?tab=stripe&refresh=1`;

    let accountId = body.stripeAccountId?.trim() || null;

    if (!accountId) {
      const account = await createExpressConnectAccount(
        stripe,
        body.providerId ?? "demo-provider-1",
      );
      accountId = account.id;
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
    const message = getStripeConnectErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
