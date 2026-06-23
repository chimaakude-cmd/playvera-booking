import type { NextRequest } from "next/server";
import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveProviderIdForAuthUser } from "@/lib/club-profile/server";
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
  getStripeApiErrorFields,
  getStripeConnectTechnicalMessage,
  isStripeConnectAdminDebugEnabled,
  logStripeConnectError,
  STRIPE_CONNECT_LOG_PREFIX,
} from "@/lib/stripe/errors";
import { resolveStripeMode } from "@/lib/stripe/env";
import { resolveStripePlatformConfig } from "@/lib/stripe/platform-admin/resolve";
import { getStripe, isStripeConfiguredAsync } from "@/lib/stripe/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";

export type StripeConnectStartResult =
  | { ok: true; url: string; stripeAccountId: string; providerId: string }
  | {
      ok: false;
      reason: string;
      message: string;
      adminDetail?: string;
      stripeCode?: string;
      providerId?: string;
    };

const PLATFORM_UNAVAILABLE_MESSAGE =
  "Connect Stripe to accept paid bookings.";

export function buildStripeProviderFinanceUrls(request: Request): {
  returnUrl: string;
  refreshUrl: string;
} {
  const baseUrl = getAppBaseUrl(request);
  return {
    returnUrl: `${baseUrl}/provider/finance/payment-providers?stripe_connected=true`,
    refreshUrl: `${baseUrl}/provider/finance/payment-providers`,
  };
}

export function buildStripeFinanceRedirectUrl(
  request: Request,
  params: Record<string, string>,
): string {
  const baseUrl = getAppBaseUrl(request);
  const url = new URL(`${baseUrl}/club/finance`);
  url.searchParams.set("tab", "payment-providers");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export async function resolveStripeConnectProviderId(
  request: Request,
  queryProviderId?: string | null,
): Promise<string | null> {
  const fromQuery = queryProviderId?.trim();
  if (fromQuery) {
    return fromQuery;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseCookieClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return resolveProviderIdForAuthUser(supabase, user.id);
  } catch {
    return null;
  }
}

async function persistProviderAccount(
  providerId: string,
  account: Awaited<ReturnType<typeof createExpressConnectAccount>>,
): Promise<void> {
  try {
    await persistProviderStripeConnect(providerId, account);
    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      step: "persistProviderStripeConnect.success",
      providerId,
      accountId: account.id,
    });
  } catch (error) {
    logStripeConnectError(error, {
      step: "persistProviderStripeConnect.failed",
      providerId,
      accountId: account.id,
    });
    throw error;
  }
}

export async function startStripeConnect(
  request: Request,
  options?: {
    queryProviderId?: string | null;
    stripeAccountId?: string | null;
    refresh?: boolean;
  },
): Promise<StripeConnectStartResult> {
  let providerId = await resolveStripeConnectProviderId(
    request,
    options?.queryProviderId,
  );

  if (!providerId) {
    providerId = isDevelopmentEnvironment() ? "demo-provider-1" : null;
  }

  if (!providerId) {
    return {
      ok: false,
      reason: "missing_provider",
      message: "Could not resolve club provider. Sign in and try again.",
    };
  }

  const configured = await isStripeConfiguredAsync();
  if (!configured) {
    return {
      ok: false,
      reason: "not_configured",
      message: PLATFORM_UNAVAILABLE_MESSAGE,
      providerId,
      adminDetail: isStripeConnectAdminDebugEnabled()
        ? "Stripe secret key is missing or invalid. Configure keys in admin or STRIPE_SECRET_KEY."
        : undefined,
    };
  }

  const platform = await resolveStripePlatformConfig(request as NextRequest);
  if (!platform.isClubConnectAvailable) {
    const blocker = platform.clubConnectBlockers[0];
    return {
      ok: false,
      reason: "not_configured",
      message: PLATFORM_UNAVAILABLE_MESSAGE,
      providerId,
      adminDetail: isStripeConnectAdminDebugEnabled()
        ? blocker ?? "Stripe club connect is not available."
        : undefined,
    };
  }

  const { returnUrl, refreshUrl } = buildStripeProviderFinanceUrls(request);
  const environment = resolveStripeMode();
  const providerEmail = await getProviderEmail(providerId);

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    step: "connect.start",
    providerId,
    refresh: Boolean(options?.refresh),
    environment,
    returnUrl,
    refreshUrl,
    hasEmail: Boolean(providerEmail),
  });

  try {
    const stripe = await getStripe();

    let accountId =
      options?.stripeAccountId?.trim() ||
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
      await persistProviderAccount(providerId, account);
    } else {
      try {
        const account = await stripe.accounts.retrieve(accountId);
        console.log(STRIPE_CONNECT_LOG_PREFIX, {
          step: "accounts.retrieve.response",
          accountId: account.id,
          providerId,
        });
        await persistProviderAccount(providerId, account);
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
        await persistProviderAccount(providerId, account);
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
      platform: STRIPE_PLATFORM_NAME,
    });

    return { ok: true, url, stripeAccountId: accountId, providerId };
  } catch (error) {
    const stripeApi = getStripeApiErrorFields(error);
    logStripeConnectError(error, {
      step: "connect.start.failed",
      providerId,
      stripeCode: stripeApi.code,
      stripeType: stripeApi.type,
      stripeMessage: stripeApi.message,
    });

    const technicalMessage = getStripeConnectTechnicalMessage(error);
    const message =
      stripeApi.message && stripeApi.message !== technicalMessage
        ? `Stripe: ${stripeApi.message}`
        : technicalMessage;

    return {
      ok: false,
      reason: "start_failed",
      message,
      providerId,
      stripeCode: stripeApi.code,
      adminDetail: isStripeConnectAdminDebugEnabled()
        ? technicalMessage
        : undefined,
    };
  }
}

export { buildStripeConnectStartPath } from "@/lib/stripe/connect-start-path";
