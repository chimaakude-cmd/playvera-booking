/**
 * Activora data layer configuration.
 *
 * Today: localStorage is the default and only fully implemented backend.
 * Later: set NEXT_PUBLIC_DATA_PROVIDER=supabase once Supabase repositories
 * are implemented and auth/RLS are configured.
 */
export type DataProviderName = "localStorage" | "supabase";

export function getDataProviderName(): DataProviderName {
  const requested = process.env.NEXT_PUBLIC_DATA_PROVIDER;

  if (requested === "localStorage") {
    return "localStorage";
  }

  return "supabase";
}

export function isSupabaseDataProviderRequested(): boolean {
  return getDataProviderName() === "supabase";
}

export function shouldUseSupabaseSessions(): boolean {
  if (process.env.NEXT_PUBLIC_DATA_PROVIDER === "localStorage") {
    return false;
  }

  return true;
}
