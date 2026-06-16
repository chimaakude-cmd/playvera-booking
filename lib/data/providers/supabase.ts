/**
 * Supabase-backed data repositories.
 *
 * Sessions are implemented. Other repositories remain localStorage-only
 * until auth and RLS are configured for those tables.
 */
import { createResilientSessionsRepository } from "@/lib/data/providers/resilient-sessions";
import { localStorageDataLayer } from "@/lib/data/providers/local-storage";
import type { ActivoraDataLayer } from "@/lib/data/types";

export const supabaseDataLayer: ActivoraDataLayer = {
  provider: "supabase",
  sessions: createResilientSessionsRepository(),
  bookings: localStorageDataLayer.bookings,
  children: localStorageDataLayer.children,
  parentProfile: localStorageDataLayer.parentProfile,
  feeSettings: localStorageDataLayer.feeSettings,
};
