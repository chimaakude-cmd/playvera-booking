import { getGoCardlessConnection } from "@/lib/gocardless/storage";
import { isGoCardlessConnected } from "@/lib/gocardless/types";
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
