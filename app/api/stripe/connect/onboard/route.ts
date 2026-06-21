import { NextResponse } from "next/server";
import {
  getProviderEmail,
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
  logStripeConnectError,
  STRIPE_CONNECT_LOG_PREFIX,
  type StripeConnectErrorCode,
} from "@/lib/stripe/errors";
import { resolveStripeMode } from "@/lib/stripe/env";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe/server";

type OnboardBody = {
  providerId?: string;
  stripeAccountId?: string | null;
  refresh?: boolean;
  email?: string;
};

function scheduleProviderPersist(
  providerId: string,
  account: Awaited<ReturnType<typeof createExpressConnectAccount>>,
): void {
  void persistProviderStripeConnect(providerId, account).catch((error) => {
    logStripeConnectError(error, {
      step: "persistProviderStripeConnect.failed",
      providerId,
      accountId: account.id,
    });
  });
}

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
    const returnUrl = `${baseUrl}/club/finance?tab=payment-providers&stripe=complete`;
    const refreshUrl = `${baseUrl}/club/finance?tab=payment-providers&retry=1`;

    const environment = resolveStripeMode();
    const providerEmail =
      body.email?.trim() || (await getProviderEmail(providerId)) || undefined;

    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      step: "onboard.start",
      providerId,
      refresh: Boolean(body.refresh),
      environment,
      returnUrl,
      refreshUrl,
      hasEmail: Boolean(providerEmail),
    });

    let accountId =
      body.stripeAccountId?.trim() ||
      (await getProviderStripeAccountId(providerId)) ||
      null;

    if (!accountId) {
      const account = await createExpressConnectAccount(
        stripe,
        providerId,
        providerEmail,
      );
      accountId = account.id;
      console.log(STRIPE_CONNECT_LOG_PREFIX, {
        step: "accounts.create.response",
        accountId: account.id,
        environment,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        providerId,
      });
      scheduleProviderPersist(providerId, account);
    } else {
      try {
        const account = await stripe.accounts.retrieve(accountId);
        console.log(STRIPE_CONNECT_LOG_PREFIX, {
          step: "accounts.retrieve.response",
          accountId: account.id,
          providerId,
        });
        scheduleProviderPersist(providerId, account);
      } catch (retrieveError) {
        logStripeConnectError(retrieveError, {
          step: "accounts.retrieve.failed",
          accountId,
          providerId,
        });

        const account = await createExpressConnectAccount(
          stripe,
          providerId,
          providerEmail,
        );
        accountId = account.id;
        console.log(STRIPE_CONNECT_LOG_PREFIX, {
          step: "accounts.create.response",
          accountId: account.id,
          environment,
          replacedStaleAccount: true,
          providerId,
        });
        scheduleProviderPersist(providerId, account);
      }
    }

    let url: string;
    try {
      url = await createOnboardingLink(
        stripe,
        accountId,
        returnUrl,
        refreshUrl,
      );
    } catch (linkError) {
      logStripeConnectError(linkError, {
        step: "accountLinks.create.failed",
        accountId,
        providerId,
        returnUrl,
        refreshUrl,
      });
      throw linkError;
    }

    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      step: "accountLinks.create.response",
      accountId,
      environment,
      redirectUrl: url,
      providerId,
    });

    return NextResponse.json({
      url,
      stripeAccountId: accountId,
      refresh: Boolean(body.refresh),
      platform: STRIPE_PLATFORM_NAME,
    });
  } catch (error) {
    const payload = buildStripeConnectErrorResponse(error, {
      route: "/api/stripe/connect/onboard",
      step: "onboard.failed",
    });
    const status =
      payload.code === "platform_unavailable" || payload.code === "not_configured"
        ? 503
        : 500;

    return NextResponse.json(payload, { status });
  }
}
