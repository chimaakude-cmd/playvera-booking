import { NextResponse } from "next/server";
import {
  getProviderStripeAccountId,
  persistProviderStripeConnect,
} from "@/lib/stripe-connect/provider-persistence";
import { buildStripeConnectState } from "@/lib/stripe/connect";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  buildStripeConnectErrorResponse,
  getStripeConnectClubMessage,
  STRIPE_CONNECT_LOG_PREFIX,
} from "@/lib/stripe/errors";
import { resolveStripeMode } from "@/lib/stripe/env";
import { getResolvedStripeEnv } from "@/lib/stripe/platform-admin/resolve";
import { getStripe, isStripeConfiguredAsync } from "@/lib/stripe/server";

export type StripeConnectStatusDebug = {
  stripe_enabled: boolean;
  connect_enabled: boolean;
  account_exists: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_required: boolean;
  environment: "test" | "live" | null;
};

async function buildStatusDebug(
  account: {
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
  } | null,
  connectEnabled: boolean,
): Promise<StripeConnectStatusDebug> {
  const stripeEnabled = await isStripeConfiguredAsync();
  const accountExists = Boolean(account);
  const chargesEnabled = Boolean(account?.charges_enabled);
  const payoutsEnabled = Boolean(account?.payouts_enabled);
  const onboardingRequired =
    !accountExists ||
    !account?.details_submitted ||
    !chargesEnabled ||
    !payoutsEnabled;

  return {
    stripe_enabled: stripeEnabled,
    connect_enabled: connectEnabled,
    account_exists: accountExists,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    onboarding_required: onboardingRequired,
    environment: resolveStripeMode(),
  };
}

export async function GET(request: Request) {
  const stripeEnabled = await isStripeConfiguredAsync();
  let connectEnabled = stripeEnabled;

  if (stripeEnabled) {
    const resolved = await getResolvedStripeEnv();
    const probe = await probeStripeConnectEnabled(resolved.secretKey);
    connectEnabled = probe.connectEnabled;
  }

  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId")?.trim() || undefined;
  let accountId = searchParams.get("accountId")?.trim() || null;

  if (!accountId && providerId) {
    accountId = (await getProviderStripeAccountId(providerId)) || null;
  }

  if (!stripeEnabled) {
    const debug = await buildStatusDebug(null, connectEnabled);
    console.warn(STRIPE_CONNECT_LOG_PREFIX, {
      route: "/api/stripe/connect/status",
      ...debug,
      reason: "STRIPE_SECRET_KEY missing",
    });

    return NextResponse.json(
      {
        error: getStripeConnectClubMessage(
          new Error("Stripe is not configured. Add STRIPE_SECRET_KEY."),
        ),
        code: "not_configured",
        debug,
      },
      { status: 503 },
    );
  }

  if (!accountId) {
    const debug = await buildStatusDebug(null, connectEnabled);
    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      route: "/api/stripe/connect/status",
      ...debug,
      accountId: null,
    });

    return NextResponse.json({
      stripeAccountId: null,
      status: "not_connected" as const,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      debug,
    });
  }

  try {
    const stripe = await getStripe();
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

    const debug = await buildStatusDebug(account, connectEnabled);

    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      route: "/api/stripe/connect/status",
      accountId,
      ...debug,
    });

    return NextResponse.json({ ...state, debug });
  } catch (error) {
    const payload = buildStripeConnectErrorResponse(error, {
      route: "/api/stripe/connect/status",
      accountId,
    });
    return NextResponse.json(payload, { status: 500 });
  }
}
