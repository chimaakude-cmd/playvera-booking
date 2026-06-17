import { isSecretKeyConfigured } from "@/lib/stripe/env";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Supabase env vars are missing — show configuration banner only in this case. */
export type AdminListDataSource = "supabase" | "env_missing";

export type AdminStatusBadgeLabel =
  | "Live data"
  | "No live payment data yet"
  | "Supabase not configured"
  | "Stripe not configured";

export function adminListDataSource(): AdminListDataSource {
  return isSupabaseConfigured() ? "supabase" : "env_missing";
}

export function isAdminEnvMissing(): boolean {
  return !isSupabaseConfigured();
}

export function isAdminStripeConfigured(): boolean {
  return isSecretKeyConfigured();
}

export function adminEnvMissingLabel(): AdminStatusBadgeLabel {
  return "Supabase not configured";
}

export function adminStripeMissingLabel(): AdminStatusBadgeLabel {
  return "Stripe not configured";
}

export function adminNoPaymentDataLabel(): AdminStatusBadgeLabel {
  return "No live payment data yet";
}

export function adminLiveDataLabel(): AdminStatusBadgeLabel {
  return "Live data";
}

export function formatSupabaseMetricsStatusLabel(
  supabaseConfigured: boolean,
): AdminStatusBadgeLabel {
  return supabaseConfigured
    ? adminLiveDataLabel()
    : adminEnvMissingLabel();
}

export function formatPaymentsStatusLabel(options: {
  supabaseConfigured: boolean;
  stripeConfigured: boolean;
  hasLivePaymentData: boolean;
}): AdminStatusBadgeLabel {
  if (!options.supabaseConfigured) {
    return adminEnvMissingLabel();
  }

  if (!options.stripeConfigured) {
    return adminStripeMissingLabel();
  }

  if (!options.hasLivePaymentData) {
    return adminNoPaymentDataLabel();
  }

  return adminLiveDataLabel();
}

export function formatPlatformRevenueStatusLabel(options: {
  supabaseConfigured: boolean;
  status: "live" | "no_data" | "env_missing";
  hasLivePaymentData: boolean;
}): AdminStatusBadgeLabel {
  if (!options.supabaseConfigured || options.status === "env_missing") {
    return adminEnvMissingLabel();
  }

  if (options.hasLivePaymentData) {
    return adminLiveDataLabel();
  }

  return adminNoPaymentDataLabel();
}
