"use client";

import { readAuthSession } from "@/lib/auth/session";
import { isActivityArchived } from "@/lib/club-activities/storage";
import { getDefaultProviderIdFromEnv } from "@/lib/data/providers/supabase/default-provider";
import { shouldUseSupabaseSessions } from "@/lib/data/config";
import type { DataSource } from "@/lib/data/types";
import { getSessionById } from "@/lib/sessions";
import { isSupabaseConfigured } from "@/lib/supabase";

export type SessionLoadDiagnostics = {
  routeId: string;
  dataSource: DataSource;
  table: "sessions" | "localStorage";
  supabaseConfigured: boolean;
  useSupabaseSessions: boolean;
  envProviderId: string | null;
  localStorageMatch: boolean;
  archivedOverride: boolean;
  found: boolean;
  error?: string;
};

export function showSessionLoadDiagnostics(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const session = readAuthSession();
  if (!session) {
    return false;
  }

  return session.role === "admin" || session.adminRole === "support_admin";
}

export function buildSessionLoadDiagnostics(input: {
  routeId: string;
  source: DataSource;
  found: boolean;
  error?: string;
}): SessionLoadDiagnostics {
  const localMatch = Boolean(getSessionById(input.routeId));

  return {
    routeId: input.routeId,
    dataSource: input.source,
    table: input.source === "supabase" ? "sessions" : "localStorage",
    supabaseConfigured: isSupabaseConfigured(),
    useSupabaseSessions: shouldUseSupabaseSessions(),
    envProviderId: getDefaultProviderIdFromEnv(),
    localStorageMatch: localMatch,
    archivedOverride: isActivityArchived(input.routeId),
    found: input.found,
    error: input.error,
  };
}

export function logSessionLoadDiagnostics(
  diagnostics: SessionLoadDiagnostics,
): void {
  if (!showSessionLoadDiagnostics()) {
    return;
  }

  console.info("[Activora session load]", diagnostics);
}
