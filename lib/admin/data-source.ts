import { isSupabaseConfigured } from "@/lib/supabase";

/** Supabase env vars are missing — show configuration banner only in this case. */
export type AdminListDataSource = "supabase" | "env_missing";

export function adminListDataSource(): AdminListDataSource {
  return isSupabaseConfigured() ? "supabase" : "env_missing";
}

export function isAdminEnvMissing(): boolean {
  return !isSupabaseConfigured();
}

export function adminEnvMissingLabel(): string {
  return "Supabase not configured";
}

export function adminLiveDataLabel(): string {
  return "Live data";
}
