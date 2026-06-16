import { getVatSettings } from "@/lib/club-finance/vat-settings";
import { getClubPayoutPreferences } from "@/lib/finance-payouts/storage";
import { DEMO_FRANCHISEE_PROVIDER_ID } from "@/lib/organisation/defaults";
import {
  getStripeConnectState,
  isStripeConnected,
  isStripePayoutReady,
} from "@/lib/stripe-connect";
import type { WizardFormData } from "@/lib/session-wizard";

export function canPublishPaidSessions(): boolean {
  return isStripeConnected(getStripeConnectState().status);
}

export function canWithdrawPayouts(): boolean {
  const stripe = getStripeConnectState();
  if (!isStripePayoutReady(stripe.status)) {
    return false;
  }

  const prefs = getClubPayoutPreferences(DEMO_FRANCHISEE_PROVIDER_ID);
  return Boolean(prefs.frequency);
}

export function canEnableVat(): boolean {
  const vat = getVatSettings();
  return vat.isVatRegistered && vat.vatRegistrationNumber.trim().length > 0;
}

export function sessionHasPaidTickets(data: WizardFormData): boolean {
  return data.tickets.some(
    (ticket) =>
      ticket.priceType !== "free" &&
      ticket.priceType !== "free_trial" &&
      (ticket.price ?? 0) > 0,
  );
}

export function getPaidSessionBlockMessage(): string {
  return "Connect Stripe to accept payments";
}

export function getPayoutBlockMessage(): string {
  return "Configure payouts in Finance after connecting Stripe to receive withdrawals.";
}

export function getVatBlockMessage(): string {
  return "Add your VAT registration details in Finance before enabling VAT on bookings.";
}
