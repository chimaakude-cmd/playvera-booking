import type Stripe from "stripe";
import { mapStripeAccountToState } from "@/lib/stripe/connect";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

function getSupabaseForProviderWrites() {
  if (isSupabaseServiceRoleConfigured()) {
    return createSupabaseServiceRoleClient();
  }
  return createSupabaseServerClient();
}

export async function getProviderEmail(
  providerId: string,
): Promise<string | undefined> {
  if (!isSupabaseConfigured() || !providerId.trim()) {
    return undefined;
  }

  const supabase = getSupabaseForProviderWrites();
  const { data, error } = await supabase
    .from("providers")
    .select("email")
    .eq("id", providerId)
    .maybeSingle();

  if (error) {
    console.error("[stripe-connect] Provider email lookup failed", {
      providerId,
      message: error.message,
    });
    return undefined;
  }

  const email = data?.email?.trim();
  return email || undefined;
}

export async function getProviderStripeAccountId(
  providerId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured() || !providerId.trim()) {
    return null;
  }

  const supabase = getSupabaseForProviderWrites();
  const { data, error } = await supabase
    .from("providers")
    .select("stripe_account_id")
    .eq("id", providerId)
    .maybeSingle();

  if (error) {
    console.error("[stripe-connect] Provider stripe_account_id lookup failed", {
      providerId,
      message: error.message,
    });
    return null;
  }

  return data?.stripe_account_id?.trim() || null;
}

export async function persistProviderStripeConnect(
  providerId: string,
  account: Stripe.Account,
): Promise<void> {
  if (!isSupabaseConfigured() || !providerId.trim()) {
    return;
  }

  const state = mapStripeAccountToState(account, providerId);
  const supabase = getSupabaseForProviderWrites();

  const update: {
    stripe_account_id: string;
    stripe_connect_status: string;
    stripe_charges_enabled: boolean;
    stripe_payouts_enabled: boolean;
    stripe_details_submitted: boolean;
    stripe_disabled_reason: string | null;
    stripe_requirements_due: string[];
    stripe_connected_at?: string;
    updated_at: string;
  } = {
    stripe_account_id: account.id,
    stripe_connect_status: state.status,
    stripe_charges_enabled: state.chargesEnabled,
    stripe_payouts_enabled: state.payoutsEnabled,
    stripe_details_submitted: state.detailsSubmitted,
    stripe_disabled_reason: state.disabledReason,
    stripe_requirements_due: state.requirementsDue,
    updated_at: new Date().toISOString(),
  };

  if (state.chargesEnabled && state.payoutsEnabled && state.detailsSubmitted) {
    update.stripe_connected_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("providers")
    .update(update)
    .eq("id", providerId);

  if (error) {
    console.error("[stripe-connect] Failed to persist provider Stripe state", {
      providerId,
      accountId: account.id,
      message: error.message,
    });
  }
}
