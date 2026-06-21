import type { ActivoraSupabaseClient } from "@/lib/supabase";

const ROLLING_MONTHS = 12;

function rollingCutoffIso(): string {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - ROLLING_MONTHS);
  return cutoff.toISOString();
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

type BookingRevenueRow = {
  session_id: string;
  price_paid: number | null;
  status: string;
  created_at: string;
};

type SessionProviderRow = {
  id: string;
  provider_id: string;
};

/**
 * Sum non-cancelled booking `price_paid` for a provider over the rolling 12-month window.
 * Uses booking `created_at` as the taxable turnover date.
 */
export async function computeRollingTwelveMonthTaxableVolume(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<number> {
  const byProvider = await computeRollingTwelveMonthTaxableVolumeByProvider(
    supabase,
    [providerId],
  );

  return byProvider.get(providerId) ?? 0;
}

/**
 * Batch rolling 12-month taxable volume for many providers (admin lists).
 */
export async function computeRollingTwelveMonthTaxableVolumeByProvider(
  supabase: ActivoraSupabaseClient,
  providerIds?: string[],
): Promise<Map<string, number>> {
  let sessionsQuery = supabase.from("sessions").select("id, provider_id");

  if (providerIds?.length) {
    sessionsQuery = sessionsQuery.in("provider_id", providerIds);
  }

  const { data: sessionRows, error: sessionsError } = await sessionsQuery;

  if (sessionsError || !sessionRows?.length) {
    return new Map();
  }

  const sessions = sessionRows as SessionProviderRow[];
  const sessionToProvider = new Map<string, string>();

  for (const session of sessions) {
    sessionToProvider.set(session.id, session.provider_id);
  }

  const sessionIds = sessions.map((session) => session.id);
  const cutoffIso = rollingCutoffIso();

  const { data: bookingRows, error: bookingsError } = await supabase
    .from("bookings")
    .select("session_id, price_paid, status, created_at")
    .in("session_id", sessionIds)
    .gte("created_at", cutoffIso);

  if (bookingsError) {
    console.error(
      "[rolling-revenue] Failed to load bookings:",
      bookingsError.message,
    );
    return new Map();
  }

  const totals = new Map<string, number>();

  for (const booking of (bookingRows ?? []) as BookingRevenueRow[]) {
    if (booking.status === "cancelled") {
      continue;
    }

    const providerId = sessionToProvider.get(booking.session_id);
    if (!providerId) {
      continue;
    }

    totals.set(
      providerId,
      (totals.get(providerId) ?? 0) + Number(booking.price_paid ?? 0),
    );
  }

  for (const [providerId, total] of totals) {
    totals.set(providerId, roundMoney(total));
  }

  return totals;
}
