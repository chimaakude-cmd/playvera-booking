import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import type { GoCardlessConnectionStatus } from "./types";

function getSupabaseForProviderWrites() {
  if (isSupabaseServiceRoleConfigured()) {
    return createSupabaseServiceRoleClient();
  }
  return createSupabaseServerClient();
}

export type ProviderGoCardlessRow = {
  gocardless_status: string;
  gocardless_organisation_id: string | null;
  gocardless_merchant_id: string | null;
  gocardless_connected_at: string | null;
};

export async function getProviderGoCardlessState(
  providerId: string,
): Promise<ProviderGoCardlessRow | null> {
  if (!isSupabaseConfigured() || !providerId.trim()) {
    return null;
  }

  const supabase = getSupabaseForProviderWrites();
  const { data, error } = await supabase
    .from("providers")
    .select(
      "gocardless_status, gocardless_organisation_id, gocardless_merchant_id, gocardless_connected_at",
    )
    .eq("id", providerId)
    .maybeSingle();

  if (error) {
    console.error("[gocardless] Provider state lookup failed", {
      providerId,
      message: error.message,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  return data as ProviderGoCardlessRow;
}

export async function persistProviderGoCardlessConnect(params: {
  providerId: string;
  organisationId: string;
  merchantId: string;
  status?: GoCardlessConnectionStatus;
}): Promise<void> {
  if (!isSupabaseConfigured() || !params.providerId.trim()) {
    return;
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseForProviderWrites();

  const { error } = await supabase
    .from("providers")
    .update({
      gocardless_status: params.status ?? "connected",
      gocardless_organisation_id: params.organisationId,
      gocardless_merchant_id: params.merchantId,
      gocardless_connected_at: now,
      payment_method_gocardless_dd: true,
      preferred_payment_provider: "gocardless",
      updated_at: now,
    })
    .eq("id", params.providerId);

  if (error) {
    console.error("[gocardless] Failed to persist provider GoCardless state", {
      providerId: params.providerId,
      message: error.message,
    });
  }
}

export async function clearProviderGoCardlessConnect(
  providerId: string,
): Promise<void> {
  if (!isSupabaseConfigured() || !providerId.trim()) {
    return;
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseForProviderWrites();

  const { error } = await supabase
    .from("providers")
    .update({
      gocardless_status: "not_connected",
      gocardless_organisation_id: null,
      gocardless_merchant_id: null,
      gocardless_connected_at: null,
      payment_method_gocardless_dd: false,
      updated_at: now,
    })
    .eq("id", providerId);

  if (error) {
    console.error("[gocardless] Failed to clear provider GoCardless state", {
      providerId,
      message: error.message,
    });
  }
}
