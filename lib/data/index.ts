/**
 * Activora data layer entry point.
 */
import { getDataProviderName, shouldUseSupabaseSessions } from "@/lib/data/config";
import { localStorageDataLayer } from "@/lib/data/providers/local-storage";
import { supabaseDataLayer } from "@/lib/data/providers/supabase";
import {
  loadSessionWithMeta,
  loadSessionsWithMeta,
  saveSessionWithMeta,
  updateSessionWithMeta,
} from "@/lib/data/providers/resilient-sessions";
import type { ActivoraDataLayer } from "@/lib/data/types";
import { isSupabaseConfigured } from "@/lib/supabase";

export type {
  ActivoraDataLayer,
  BookingsRepository,
  ChildrenRepository,
  DataSource,
  FeeSettingsRepository,
  ParentProfileRepository,
  SessionsQueryOptions,
  SessionsRepository,
  SessionsResult,
} from "@/lib/data/types";

export {
  getDataProviderName,
  isSupabaseDataProviderRequested,
  shouldUseSupabaseSessions,
} from "@/lib/data/config";

export {
  dismissLocalSessionImport,
  getLocalSessionCount,
  importLocalSessionsToSupabase,
  shouldShowImportLocalSessionsBanner,
} from "@/lib/data/local-session-import";

export {
  loadSessionWithMeta,
  loadSessionsWithMeta,
  saveSessionWithMeta,
  updateSessionWithMeta,
} from "@/lib/data/providers/resilient-sessions";

export {
  deleteProviderVenue,
  loadProviderVenues,
  saveProviderVenue,
} from "@/lib/data/provider-venues";

export {
  getSessionsMissingCoordinates,
  repairMissingSessionCoordinates,
} from "@/lib/session-geocoding";

export { GEOCODING_FAILED_MESSAGE } from "@/lib/geocoding";
export { SupabaseSaveError } from "@/lib/data/supabase-errors";
export { saveSessionToSupabase } from "@/lib/data/session-save";

export function createDataLayer(
  provider = getDataProviderName(),
): ActivoraDataLayer {
  if (provider === "supabase" || shouldUseSupabaseSessions()) {
    return supabaseDataLayer;
  }

  return localStorageDataLayer;
}

/** Singleton used by the app. Sessions prefer Supabase when configured. */
export const dataLayer = createDataLayer();

export function getSupabaseSessionsSetupMessage(): string {
  return (
    "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, run " +
    "supabase/migrations/00005_dev_anon_access.sql, then restart the dev server."
  );
}

export function shouldShowSupabaseSessionsNotice(): boolean {
  if (!shouldUseSupabaseSessions()) {
    return false;
  }

  return !isSupabaseConfigured();
}
