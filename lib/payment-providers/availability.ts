import { getGoCardlessConnection } from "@/lib/gocardless/storage";
import {
  isGoCardlessConnected,
  type GoCardlessConnectionStatus,
} from "@/lib/gocardless/types";
import { getStripeConnectState } from "@/lib/stripe-connect/storage";
import type { ActivityPaymentProvider } from "./types";
import {
  getPaymentProviderSettings,
  isGoCardlessCheckoutAvailable,
  isStripeCheckoutAvailable,
} from "./storage";
import {
  isGoCardlessPaymentSetupReady,
  isPaymentSetupComplete,
  isStripePaymentSetupReadyFromState,
} from "./setup-status";
import type { ClubSession } from "@/lib/sessions";

type PaidActivityInput = {
  paymentModel: "block_individual" | "subscription" | null;
  paymentProvider: ActivityPaymentProvider;
};

export type SessionCheckoutMethods = {
  stripe: boolean;
  gocardless: boolean;
  /** True when the activity accepts both and more than one method is shown. */
  parentPicksMethod: boolean;
};

export type GoCardlessProviderAvailabilityStatus =
  | "not_connected"
  | "available"
  | "unavailable"
  | "under_review"
  | "connected"
  | "action_required";

export type GoCardlessProviderAvailability = {
  available: boolean;
  connected: boolean;
  status: GoCardlessProviderAvailabilityStatus;
  reason: string | null;
  blocking: boolean;
};

export const GOCARDLESS_DISPLAY_STATUS_LABELS: Record<
  GoCardlessProviderAvailabilityStatus,
  string
> = {
  not_connected: "Not connected",
  available: "Available",
  unavailable: "Temporarily unavailable",
  under_review: "Under review",
  connected: "Connected",
  action_required: "Action required",
};

export const GOCARDLESS_UNAVAILABLE_FALLBACK: GoCardlessProviderAvailability =
  {
    available: false,
    connected: false,
    status: "unavailable",
    reason: "GoCardless settings unavailable",
    blocking: false,
  };

export function resolveGoCardlessDisplayStatus(params: {
  connectionStatus: GoCardlessConnectionStatus;
  merchantId?: string | null;
  platformConfigured: boolean;
  platformUnavailable: boolean;
  configLoadFailed?: boolean;
}): GoCardlessProviderAvailabilityStatus {
  if (params.configLoadFailed || params.platformUnavailable) {
    return "unavailable";
  }

  if (isGoCardlessConnected(params.connectionStatus, params.merchantId)) {
    return "connected";
  }

  if (params.connectionStatus === "action_required") {
    return "action_required";
  }

  if (params.connectionStatus === "pending_setup") {
    return "under_review";
  }

  if (params.platformConfigured) {
    return "available";
  }

  return "not_connected";
}

/** Safe local snapshot — never throws; returns fallback on failure. */
export function resolveGoCardlessProviderAvailability(
  providerId?: string,
  platformHint?: {
    platformConfigured: boolean;
    platformUnavailable: boolean;
    configLoadFailed?: boolean;
  },
): GoCardlessProviderAvailability {
  try {
    const connection = getGoCardlessConnection(providerId);
    const connected = isGoCardlessConnected(
      connection.status,
      connection.merchant_id,
    );
    const platformConfigured = platformHint?.platformConfigured ?? false;
    const platformUnavailable = platformHint?.platformUnavailable ?? true;
    const configLoadFailed = platformHint?.configLoadFailed ?? false;

    if (configLoadFailed && !connected) {
      return GOCARDLESS_UNAVAILABLE_FALLBACK;
    }

    const status = resolveGoCardlessDisplayStatus({
      connectionStatus: connection.status,
      merchantId: connection.merchant_id,
      platformConfigured,
      platformUnavailable,
      configLoadFailed,
    });

    if (status === "unavailable" && !connected) {
      return {
        available: false,
        connected: false,
        status: "unavailable",
        reason: "GoCardless settings unavailable",
        blocking: false,
      };
    }

    return {
      available: platformConfigured || connected,
      connected,
      status,
      reason: null,
      blocking: false,
    };
  } catch {
    return GOCARDLESS_UNAVAILABLE_FALLBACK;
  }
}

/** Fetch GoCardless platform + connection state; returns fallback instead of throwing. */
export async function fetchGoCardlessProviderAvailability(
  providerId: string,
): Promise<GoCardlessProviderAvailability> {
  try {
    const [configResponse, statusResponse] = await Promise.all([
      fetch("/api/gocardless/connect/config", { credentials: "include" }),
      fetch(
        `/api/gocardless/connect/status?providerId=${encodeURIComponent(providerId)}`,
        { credentials: "include" },
      ),
    ]);

    if (!configResponse.ok) {
      return GOCARDLESS_UNAVAILABLE_FALLBACK;
    }

    const config = (await configResponse.json()) as {
      platformConfigured?: boolean;
      platformUnavailable?: boolean;
    };

    const platformConfigured = config.platformConfigured ?? false;
    const platformUnavailable = config.platformUnavailable ?? true;

    if (!statusResponse.ok) {
      return resolveGoCardlessProviderAvailability(providerId, {
        platformConfigured,
        platformUnavailable,
        configLoadFailed: true,
      });
    }

    const statusPayload = (await statusResponse.json()) as {
      status?: GoCardlessConnectionStatus;
      merchantId?: string | null;
    };

    const connectionStatus =
      statusPayload.status ?? ("not_connected" as GoCardlessConnectionStatus);
    const displayStatus = resolveGoCardlessDisplayStatus({
      connectionStatus,
      merchantId: statusPayload.merchantId,
      platformConfigured,
      platformUnavailable,
    });

    const connected = isGoCardlessConnected(
      connectionStatus,
      statusPayload.merchantId,
    );

    if (displayStatus === "unavailable" && !connected) {
      return {
        available: false,
        connected: false,
        status: "unavailable",
        reason: "GoCardless settings unavailable",
        blocking: false,
      };
    }

    return {
      available: platformConfigured || connected,
      connected,
      status: displayStatus,
      reason: null,
      blocking: false,
    };
  } catch {
    return GOCARDLESS_UNAVAILABLE_FALLBACK;
  }
}

/** True when Stripe or GoCardless is fully connected for paid activities. */
export function hasPaymentProviderConnected(providerId?: string): boolean {
  return isPaymentSetupComplete(providerId);
}

export function isStripePaymentsReady(providerId?: string): boolean {
  return isStripeCheckoutAvailable(providerId);
}

/** Club-owned GoCardless — requires OAuth connection and enabled method. */
export function isGoCardlessPaymentsReady(providerId?: string): boolean {
  const settings = getPaymentProviderSettings(providerId);

  if (!settings.enabled_methods?.gocardless_direct_debit) {
    return false;
  }

  const gocardless = getGoCardlessConnection(settings.provider_id);
  return isGoCardlessConnected(gocardless.status, gocardless.merchant_id);
}

export function hasAnyPaymentProviderReady(providerId?: string): boolean {
  return (
    isStripePaymentsReady(providerId) || isGoCardlessPaymentsReady(providerId)
  );
}

export function isClubPaymentsConfigured(providerId?: string): boolean {
  return isPaymentSetupComplete(providerId);
}

export function resolveActivityPaymentProvider(
  paymentProvider: ActivityPaymentProvider | undefined,
  providerId?: string,
): "stripe" | "gocardless" {
  if (
    paymentProvider === "gocardless" ||
    paymentProvider === "activora_managed"
  ) {
    return "gocardless";
  }

  if (paymentProvider === "stripe") {
    return "stripe";
  }

  const settings = getPaymentProviderSettings(providerId);
  if (settings.club_default_provider === "gocardless") {
    return "gocardless";
  }

  return "stripe";
}

export function sessionIsPaid(session: ClubSession): boolean {
  if (session.bookingStructure === "subscription") {
    return true;
  }

  if (session.price > 0) {
    return true;
  }

  return (session.tickets ?? []).some(
    (ticket) =>
      ticket.priceType !== "free" &&
      ticket.priceType !== "free_trial" &&
      (ticket.price ?? 0) > 0,
  );
}

export function resolveSessionPaymentProvider(
  session: ClubSession,
  providerId?: string,
): "stripe" | "gocardless" | null {
  if (!sessionIsPaid(session)) {
    return null;
  }

  if (session.paymentProvider === "both") {
    return null;
  }

  return resolveActivityPaymentProvider(session.paymentProvider, providerId);
}

export function resolveSessionCheckoutMethods(
  session: ClubSession,
  providerId?: string,
): SessionCheckoutMethods | null {
  if (!sessionIsPaid(session)) {
    return null;
  }

  const stripeAvailable = isStripeCheckoutAvailable(providerId);
  const gocardlessAvailable = isGoCardlessCheckoutAvailable(providerId);
  const activityProvider = session.paymentProvider ?? "club_default";

  if (activityProvider === "both") {
    const stripe = stripeAvailable;
    const gocardless = gocardlessAvailable;
    return {
      stripe,
      gocardless,
      parentPicksMethod: stripe && gocardless,
    };
  }

  const resolved = resolveActivityPaymentProvider(activityProvider, providerId);

  if (resolved === "stripe") {
    return {
      stripe: stripeAvailable,
      gocardless: false,
      parentPicksMethod: false,
    };
  }

  return {
    stripe: false,
    gocardless: gocardlessAvailable,
    parentPicksMethod: false,
  };
}

export function resolveWizardPaymentProvider(
  data: PaidActivityInput,
  providerId?: string,
): "stripe" | "gocardless" | "both" {
  if (data.paymentProvider === "both") {
    return "both";
  }

  return resolveActivityPaymentProvider(data.paymentProvider, providerId);
}

export function validateActivityPaymentProvider(
  data: PaidActivityInput,
  isPaid: boolean,
): string[] {
  if (!isPaid) {
    return [];
  }

  if (!isPaymentSetupComplete()) {
    return [
      "Connect GoCardless or Stripe in Finance before publishing paid activities.",
    ];
  }

  if (!hasAnyPaymentProviderReady()) {
    return [
      "Enable at least one payment method in Finance before publishing paid activities.",
    ];
  }

  const resolved = resolveWizardPaymentProvider(data);

  if (resolved === "both") {
    if (!isStripePaymentsReady() || !isGoCardlessPaymentsReady()) {
      return [
        "Connect and enable both Stripe and GoCardless in Finance before accepting both payment methods.",
      ];
    }
    return [];
  }

  if (resolved === "stripe" && !isStripePaymentSetupReadyFromState(getStripeConnectState())) {
    return [
      "Stripe is not connected. Connect Stripe in Finance or choose Direct Debit.",
    ];
  }

  if (resolved === "stripe" && !isStripePaymentsReady()) {
    return [
      "Enable Stripe card payments in Finance or choose Direct Debit.",
    ];
  }

  if (resolved === "gocardless") {
    const gocardless = getGoCardlessConnection(getPaymentProviderSettings().provider_id);
    if (!isGoCardlessPaymentSetupReady(gocardless.status, gocardless.merchant_id)) {
      return [
        "GoCardless is not connected. Connect GoCardless in Finance or choose Stripe.",
      ];
    }
    if (!isGoCardlessPaymentsReady()) {
      return [
        "Enable GoCardless Direct Debit in Finance or choose Stripe.",
      ];
    }
  }

  return [];
}
