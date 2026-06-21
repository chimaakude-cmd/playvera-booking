import {
  mapSessionRowsToClubSession,
  type SessionDateRow,
  type SessionRow,
  type TicketRow,
} from "@/lib/data/mappers/session-mapper";
import {
  fetchClubProfileForProvider,
  resolveProviderIdForAuthUser,
} from "@/lib/club-profile/server";
import type { ClubProfile } from "@/lib/club-profile/types";
import type { ActivoraSupabaseClient } from "@/lib/supabase";
import {
  isStripeConnected,
  isStripePayoutReady,
  type StripeConnectStatus,
} from "@/lib/stripe-connect/types";
import type { ClubSession } from "@/lib/sessions";
import { computeSetupProgress } from "./compute";
import type { SetupProgressContext } from "./context";
import type { SetupProgressResult } from "./types";

const STRIPE_STATUSES: StripeConnectStatus[] = [
  "not_connected",
  "action_required",
  "connected",
  "restricted",
  "payouts_enabled",
];

function normalizeStripeStatus(
  value: string | null | undefined,
): StripeConnectStatus {
  if (value && STRIPE_STATUSES.includes(value as StripeConnectStatus)) {
    return value as StripeConnectStatus;
  }

  return "not_connected";
}

function groupBySessionId<T extends { session_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const current = grouped.get(row.session_id) ?? [];
    current.push(row);
    grouped.set(row.session_id, current);
  }

  return grouped;
}

async function loadClubSessionsForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<ClubSession[]> {
  const { data: sessionRows, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error || !sessionRows?.length) {
    return [];
  }

  const rows = sessionRows as SessionRow[];
  const sessionIds = rows.map((row) => row.id);

  const [{ data: dateRows }, { data: ticketRows }] = await Promise.all([
    supabase
      .from("session_dates")
      .select("*")
      .in("session_id", sessionIds)
      .order("session_date", { ascending: true }),
    supabase
      .from("tickets")
      .select("*")
      .in("session_id", sessionIds)
      .order("sort_order", { ascending: true }),
  ]);

  const datesBySessionId = groupBySessionId(
    (dateRows ?? []) as SessionDateRow[],
  );
  const ticketsBySessionId = groupBySessionId(
    (ticketRows ?? []) as TicketRow[],
  );

  return rows.map((row) =>
    mapSessionRowsToClubSession(
      row,
      datesBySessionId.get(row.id) ?? [],
      ticketsBySessionId.get(row.id) ?? [],
    ),
  );
}

async function loadProviderPaymentFlags(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<{
  stripeStatus: StripeConnectStatus;
  gocardlessEnabled: boolean;
}> {
  const { data, error } = await supabase
    .from("providers")
    .select(
      "stripe_connect_status, payment_method_stripe_card, payment_method_gocardless_dd, preferred_payment_provider",
    )
    .eq("id", providerId)
    .maybeSingle();

  if (error || !data) {
    return { stripeStatus: "not_connected", gocardlessEnabled: false };
  }

  const preferred = String(data.preferred_payment_provider ?? "stripe");
  const gocardlessEnabled =
    Boolean(data.payment_method_gocardless_dd) ||
    preferred === "gocardless" ||
    preferred === "ask_per_activity";

  return {
    stripeStatus: normalizeStripeStatus(data.stripe_connect_status),
    gocardlessEnabled,
  };
}

async function loadHasTeamMembers(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("club_team_members")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("status", "active")
    .eq("is_owner", false);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

async function loadHasVatDetails(): Promise<boolean> {
  // VAT settings are still stored client-side until provider-scoped DB migration lands.
  return false;
}

async function loadHasCustomBookingQuestions(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<boolean> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id")
    .eq("provider_id", providerId);

  if (sessionsError || !sessions?.length) {
    return false;
  }

  const sessionIds = sessions.map((session) => session.id);
  const { count, error } = await supabase
    .from("session_booking_questions")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds)
    .eq("is_custom", true);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

export async function buildSetupProgressContextForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  profile?: ClubProfile | null,
): Promise<SetupProgressContext | null> {
  const resolvedProfile =
    profile ?? (await fetchClubProfileForProvider(supabase, providerId));

  if (!resolvedProfile) {
    return null;
  }

  const [
    sessions,
    paymentFlags,
    hasTeamMembers,
    hasVatDetails,
    hasBookingQuestionsConfigured,
  ] = await Promise.all([
    loadClubSessionsForProvider(supabase, providerId),
    loadProviderPaymentFlags(supabase, providerId),
    loadHasTeamMembers(supabase, providerId),
    loadHasVatDetails(),
    loadHasCustomBookingQuestions(supabase, providerId),
  ]);

  const stripeStatus = paymentFlags.stripeStatus;
  const stripeConnected = isStripeConnected(stripeStatus);
  const stripePayoutReady = isStripePayoutReady(stripeStatus);

  return {
    sessions,
    profile: resolvedProfile,
    stripeConnected,
    stripePayoutReady,
    paymentsConfigured: stripeConnected || paymentFlags.gocardlessEnabled,
    hasTeamMembers,
    hasVatDetails,
    hasBookingQuestionsConfigured,
    hasPayoutPreferencesConfigured: stripePayoutReady,
  };
}

export async function fetchSetupProgressForAuthUser(
  supabase: ActivoraSupabaseClient,
  authUserId: string,
): Promise<SetupProgressResult | null> {
  const providerId = await resolveProviderIdForAuthUser(supabase, authUserId);
  if (!providerId) {
    return null;
  }

  const context = await buildSetupProgressContextForProvider(
    supabase,
    providerId,
  );

  if (!context) {
    return null;
  }

  return computeSetupProgress(context);
}

export async function fetchSetupProgressContextForAuthUser(
  supabase: ActivoraSupabaseClient,
  authUserId: string,
): Promise<SetupProgressContext | null> {
  const providerId = await resolveProviderIdForAuthUser(supabase, authUserId);
  if (!providerId) {
    return null;
  }

  return buildSetupProgressContextForProvider(supabase, providerId);
}
