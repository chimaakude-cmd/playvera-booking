import type Stripe from "stripe";
import { mapStripeAccountToState } from "@/lib/stripe/connect";
import {
  fetchProviderStripeAccountId,
  updateProviderStripeConnectWithFallback,
} from "@/lib/providers/payment-schema";
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

  try {
    return await fetchProviderStripeAccountId(
      getSupabaseForProviderWrites(),
      providerId,
    );
  } catch (error) {
    console.error("[stripe-connect] Provider stripe_account_id lookup failed", {
      providerId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
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
  const updatedAt = new Date().toISOString();

  const update = {
    stripe_account_id: account.id,
    stripe_connect_status: state.status,
    stripe_charges_enabled: state.chargesEnabled,
    stripe_payouts_enabled: state.payoutsEnabled,
    stripe_details_submitted: state.detailsSubmitted,
    stripe_disabled_reason: state.disabledReason,
    stripe_requirements_due: state.requirementsDue,
    stripe_onboarding_complete: state.detailsSubmitted,
    updated_at: updatedAt,
    ...(state.chargesEnabled && state.payoutsEnabled && state.detailsSubmitted
      ? { stripe_connected_at: updatedAt }
      : {}),
  };

  const { error } = await updateProviderStripeConnectWithFallback(
    supabase,
    providerId,
    update,
  );

  if (error) {
    console.error("[stripe-connect] Failed to persist provider Stripe state", {
      providerId,
      accountId: account.id,
      message: error.message,
    });
    throw new Error(error.message);
  }
}
