import type { PostgrestError } from "@supabase/supabase-js";

export function formatPostgrestError(
  context: string,
  error: PostgrestError | { message: string; code?: string; details?: string; hint?: string },
): string {
  const parts = [`${context}: ${error.message}`];

  if ("code" in error && error.code) {
    parts.push(`PostgreSQL code: ${error.code}`);
  }

  if ("details" in error && error.details) {
    parts.push(`Details: ${error.details}`);
  }

  if ("hint" in error && error.hint) {
    parts.push(`Hint: ${error.hint}`);
  }

  const message = error.message.toLowerCase();

  if (message.includes("permission denied")) {
    parts.push(
      "Fix: run supabase/migrations/00005_dev_anon_access.sql in the Supabase SQL Editor (DEV ONLY grants + RLS).",
    );
  }

  if (message.includes("row-level security")) {
    parts.push(
      "Fix: run supabase/migrations/00005_dev_anon_access.sql in the Supabase SQL Editor (DEV ONLY grants + RLS).",
    );
  }

  if (
    message.includes("venue_name") ||
    message.includes("address_line_1") ||
    message.includes("town_city") ||
    message.includes("postcode")
  ) {
    parts.push(
      "Fix: run supabase/migrations/00004_session_location.sql in the Supabase SQL Editor.",
    );
  }

  if (message.includes("booking_type") || message.includes("session_booking_type")) {
    parts.push(
      "Fix: sessions.booking_type enum mismatch — check supabase/migrations/00001_activora_schema.sql.",
    );
  }

  if (message.includes("ticket_type")) {
    parts.push(
      "Fix: tickets.ticket_type enum mismatch — expected block_price, not term_block.",
    );
  }

  if (message.includes("provider_id") || message.includes("providers")) {
    parts.push(
      "Fix: run supabase/migrations/00005_dev_anon_access.sql (seeds Demo Provider + DEV ONLY anon access).",
    );
  }

  if (message.includes("provider_venues") || message.includes("provider_venue_id")) {
    parts.push(
      "Fix: run supabase/migrations/00006_provider_venues.sql and 00007_dev_provider_venues_access.sql in the Supabase SQL Editor.",
    );
  }

  return parts.join(" | ");
}

export class SupabaseSaveError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SupabaseSaveError";
  }
}
