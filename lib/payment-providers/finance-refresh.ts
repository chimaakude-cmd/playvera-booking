import type { ClubPaymentStatusApiResponse } from "@/lib/payments/club-payment-status";
import {
  fetchStripeConnectStatus,
  resolveStripeConnectProviderId,
} from "@/lib/stripe-connect/storage";
import { invalidateStripeConnectStatusCache } from "@/lib/stripe-connect/use-stripe-connect-status";
import type { StripeConnectState } from "@/lib/stripe-connect/types";
import {
  getPaymentProviderSettings,
  savePaymentProviderSettings,
  syncProviderStatuses,
} from "./storage";
import type { PaymentProviderSettings } from "./types";

export type ProviderFinanceRefreshResult = {
  stripe: StripeConnectState;
  settings: PaymentProviderSettings;
  paymentStatus: ClubPaymentStatusApiResponse | null;
};

export function invalidateProviderCache(): void {
  invalidateStripeConnectStatusCache();
}

export async function refreshProviderFinanceState(
  providerId?: string,
): Promise<ProviderFinanceRefreshResult> {
  invalidateProviderCache();
  const resolvedProviderId = resolveStripeConnectProviderId();

  const stripe = await fetchStripeConnectStatus();
  const settings = savePaymentProviderSettings(
    syncProviderStatuses(
      getPaymentProviderSettings(providerId ?? resolvedProviderId),
    ),
  );

  let paymentStatus: ClubPaymentStatusApiResponse | null = null;
  try {
    const response = await fetch("/api/club/payment-status", {
      credentials: "include",
      cache: "no-store",
    });
    if (response.ok) {
      paymentStatus = (await response.json()) as ClubPaymentStatusApiResponse;
    }
  } catch {
    paymentStatus = null;
  }

  return { stripe, settings, paymentStatus };
}

export function isStripeOnboardingReturn(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return (
    searchParams.get("stripe") === "complete" ||
    searchParams.get("stripe_connected") === "true" ||
    searchParams.get("connected") === "1" ||
    searchParams.get("stripe") === "connected"
  );
}
