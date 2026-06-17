import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type ActivoraSupabaseClient = SupabaseClient<Database>;

/**
 * Read Supabase URL at call time.
 * NEXT_PUBLIC_* values are inlined at build time on Vercel — redeploy after
 * adding or changing them in the dashboard.
 */
function resolveSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

/**
 * Read Supabase anon key at call time.
 * NEXT_PUBLIC_* values are inlined at build time on Vercel — redeploy after
 * adding or changing them in the dashboard.
 */
function resolveSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

/**
 * Returns true when both Supabase public env vars are set.
 * Used by the data layer before switching away from localStorage.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(resolveSupabaseUrl() && resolveSupabaseAnonKey());
}

/**
 * Creates a new Supabase browser client.
 * Will replace direct localStorage reads/writes once auth and RLS are in place.
 */
export function createSupabaseBrowserClient(): ActivoraSupabaseClient {
  const supabaseUrl = resolveSupabaseUrl();
  const supabaseAnonKey = resolveSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let browserClient: ActivoraSupabaseClient | null = null;

/**
 * Singleton browser client for client components.
 * Server Components / Route Handlers should use createSupabaseServerClient()
 * once @supabase/ssr is added during the auth migration.
 */
export function getSupabaseBrowserClient(): ActivoraSupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseBrowserClient() is client-only. Use createSupabaseServerClient() in Server Components.",
    );
  }

  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }

  return browserClient;
}

/**
 * Server-side Supabase client for Server Components and Route Handlers.
 * Uses the public anon key — RLS policies apply.
 */
export function createSupabaseServerClient(): ActivoraSupabaseClient {
  const supabaseUrl = resolveSupabaseUrl();
  const supabaseAnonKey = resolveSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
