import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import type { ActivoraSupabaseClient } from "@/lib/supabase";

function resolveSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

function resolveSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

function assertSupabaseConfigured(): { url: string; anonKey: string } {
  const url = resolveSupabaseUrl();
  const anonKey = resolveSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  return { url, anonKey };
}

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers
 * that read/write via next/headers cookies().
 */
export async function createSupabaseCookieClient(): Promise<ActivoraSupabaseClient> {
  const { url, anonKey } = assertSupabaseConfigured();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        } catch {
          // setAll can throw when called from a Server Component (read-only cookies).
        }
      },
    },
  }) as ActivoraSupabaseClient;
}

/**
 * Cookie-aware Supabase client for Route Handlers that return redirects
 * and must attach refreshed auth cookies to the response.
 */
export function createSupabaseRouteClient(
  request: NextRequest,
  response: NextResponse,
): ActivoraSupabaseClient {
  const { url, anonKey } = assertSupabaseConfigured();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  }) as ActivoraSupabaseClient;
}
