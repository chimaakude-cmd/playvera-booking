import type { ActivoraSupabaseClient } from "@/lib/supabase";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

export type AdminSupabaseClientMode = "service_role" | "anon";

/**
 * Server-side Supabase client for platform admin data reads/writes.
 * Prefers the service role key so admin queries bypass club-scoped RLS.
 */
export function getAdminSupabaseClient(): ActivoraSupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  if (isSupabaseServiceRoleConfigured()) {
    return createSupabaseServiceRoleClient();
  }

  return createSupabaseServerClient();
}

export function getAdminSupabaseClientMode(): AdminSupabaseClientMode {
  return isSupabaseServiceRoleConfigured() ? "service_role" : "anon";
}
