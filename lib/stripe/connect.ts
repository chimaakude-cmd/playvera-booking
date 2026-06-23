import type Stripe from "stripe";
import type {
  StripeConnectDashboard,
  StripeConnectState,
  StripeConnectStatus,
} from "@/lib/stripe-connect/types";
import { DEMO_PROVIDER_ID } from "@/lib/stripe-connect/types";
import { STRIPE_CONNECT_COUNTRY, STRIPE_PLATFORM_NAME } from "./constants";
import { STRIPE_CONNECT_LOG_PREFIX, logStripeConnectError } from "./errors";

export function resolveStripeConnectStatus(
  account: Stripe.Account | null,
): StripeConnectStatus {
  if (!account) {
    return "not_connected";
  }

  if (account.requirements?.disabled_reason) {
    return "restricted";
  }

  const pastDue = account.requirements?.past_due ?? [];
  const currentlyDue = account.requirements?.currently_due ?? [];
  const pendingVerification = account.requirements?.pending_verification ?? [];

  if (pastDue.length > 0 && !account.payouts_enabled) {
    return "restricted";
  }

  if (
    !account.details_submitted ||
    currentlyDue.length > 0 ||
    pendingVerification.length > 0
  ) {
    if (account.charges_enabled && account.payouts_enabled) {
      return "payouts_enabled";
    }
    if (account.charges_enabled) {
      return "connected";
    }
    return "action_required";
  }

  if (account.payouts_enabled && account.charges_enabled) {
    return "payouts_enabled";
  }

  if (account.charges_enabled) {
    return "connected";
  }

  return "action_required";
}

export function resolveVerificationStatus(account: Stripe.Account): string {
  if (account.requirements?.disabled_reason) {
    return "Restricted";
  }

  if ((account.requirements?.pending_verification?.length ?? 0) > 0) {
    return "Pending verification";
  }

  if ((account.requirements?.currently_due?.length ?? 0) > 0) {
    return "Action required";
  }

  if (account.charges_enabled && account.payouts_enabled) {
    return "Verified";
  }

  if (account.details_submitted) {
    return "Under review";
  }

  return "Not verified";
}

export function formatPayoutSchedule(
  schedule: Stripe.Account.Settings.Payouts.Schedule | null | undefined,
): string | null {
  if (!schedule?.interval) {
    return null;
  }

  if (schedule.interval === "manual") {
    return "Manual payouts";
  }

  if (schedule.interval === "daily") {
    return "Daily";
  }

  if (schedule.interval === "weekly") {
    const day = schedule.weekly_anchor ?? "friday";
    return `Weekly on ${day}`;
  }

  if (schedule.interval === "monthly") {
    const day = schedule.monthly_anchor ?? 1;
    return `Monthly on day ${day}`;
  }

  return schedule.interval;
}

function sumBalance(
  balances: Array<{ currency: string; amount: number }> | undefined,
  currency = "gbp",
): number {
  if (!balances?.length) {
    return 0;
  }

  const match =
    balances.find((entry) => entry.currency === currency) ?? balances[0];

  return Math.round(match.amount) / 100;
}

export async function fetchConnectDashboard(
  stripe: Stripe,
  account: Stripe.Account,
): Promise<StripeConnectDashboard> {
  const currency = (account.default_currency ?? "gbp").toLowerCase();

  let availableBalance = 0;
  let pendingBalance = 0;

  try {
    const balance = await stripe.balance.retrieve(undefined, {
      stripeAccount: account.id,
    });

    availableBalance = sumBalance(
      balance.available.filter((entry) => entry.currency === currency),
      currency,
    );
    pendingBalance = sumBalance(
      balance.pending.filter((entry) => entry.currency === currency),
      currency,
    );
  } catch {
    // Balance may be unavailable during early onboarding.
  }

  let lastPayoutAmount: number | null = null;
  let lastPayoutDate: string | null = null;

  try {
    const payouts = await stripe.payouts.list(
      { limit: 1 },
      { stripeAccount: account.id },
    );
    const last = payouts.data[0];

    if (last) {
      lastPayoutAmount = last.amount / 100;
      lastPayoutDate = new Date(last.created * 1000).toISOString();
    }
  } catch {
    // Payout history may not exist yet.
  }

  return {
    payoutSchedule: formatPayoutSchedule(account.settings?.payouts?.schedule),
    availableBalance,
    pendingBalance,
    lastPayoutAmount,
    lastPayoutDate,
    verificationStatus: resolveVerificationStatus(account),
    currency: currency.toUpperCase(),
  };
}

export function mapStripeAccountToState(
  account: Stripe.Account,
  providerId: string = DEMO_PROVIDER_ID,
): StripeConnectState {
  return {
    providerId,
    stripeAccountId: account.id,
    status: resolveStripeConnectStatus(account),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    disabledReason: account.requirements?.disabled_reason ?? null,
    requirementsDue: [
      ...(account.requirements?.currently_due ?? []),
      ...(account.requirements?.past_due ?? []),
      ...(account.requirements?.pending_verification ?? []),
    ],
    dashboard: null,
    updatedAt: new Date().toISOString(),
  };
}

export async function buildStripeConnectState(
  stripe: Stripe,
  account: Stripe.Account,
  providerId: string = DEMO_PROVIDER_ID,
): Promise<StripeConnectState> {
  const base = mapStripeAccountToState(account, providerId);

  if (base.status === "not_connected") {
    return base;
  }

  try {
    const dashboard = await fetchConnectDashboard(stripe, account);
    return { ...base, dashboard };
  } catch {
    return {
      ...base,
      dashboard: {
        payoutSchedule: formatPayoutSchedule(account.settings?.payouts?.schedule),
        availableBalance: 0,
        pendingBalance: 0,
        lastPayoutAmount: null,
        lastPayoutDate: null,
        verificationStatus: resolveVerificationStatus(account),
        currency: (account.default_currency ?? "gbp").toUpperCase(),
      },
    };
  }
}

export async function createExpressConnectAccount(
  stripe: Stripe,
  providerId: string,
  email?: string,
): Promise<Stripe.Account> {
  try {
    const account = await stripe.accounts.create({
      country: STRIPE_CONNECT_COUNTRY,
      email,
      controller: {
        stripe_dashboard: { type: "express" },
        fees: { payer: "application" },
        losses: { payments: "stripe" },
      },
      business_profile: {
        name: STRIPE_PLATFORM_NAME,
      },
      metadata: {
        provider_id: providerId,
        platform: STRIPE_PLATFORM_NAME.toLowerCase(),
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      step: "accounts.create.response",
      accountId: account.id,
      type: account.type,
      country: account.country,
      providerId,
      hasEmail: Boolean(email),
    });

    return account;
  } catch (error) {
    logStripeConnectError(error, {
      step: "accounts.create.failed",
      providerId,
      hasEmail: Boolean(email),
    });
    throw error;
  }
}

export async function createOnboardingLink(
  stripe: Stripe,
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<string> {
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      step: "accountLinks.create.response",
      accountId,
      url: link.url,
      expiresAt: link.expires_at,
      returnUrl,
      refreshUrl,
    });

    if (!link.url?.trim()) {
      throw new Error("Stripe account link did not include a redirect URL.");
    }

    return link.url;
  } catch (error) {
    logStripeConnectError(error, {
      step: "accountLinks.create.failed",
      accountId,
      returnUrl,
      refreshUrl,
    });
    throw error;
  }
}
