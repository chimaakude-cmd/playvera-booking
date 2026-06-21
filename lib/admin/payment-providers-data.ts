import type { ProviderStripeStatus } from "@/lib/admin/types";
import type { GoCardlessConnectionStatus } from "@/lib/gocardless/types";
import { isGoCardlessConnected } from "@/lib/gocardless/types";
import {
  isStripeConnected,
  type StripeConnectStatus,
} from "@/lib/stripe-connect/types";
import { adminListDataSource } from "@/lib/admin/data-source";
import { getAdminSupabaseClient } from "@/lib/admin/supabase-client";
import {
  isSupabaseConfigured,
} from "@/lib/supabase";

export type AdminPaymentProviderRow = {
  providerId: string;
  clubName: string;
  stripeStatus: StripeConnectStatus;
  gocardlessStatus: GoCardlessConnectionStatus;
  needsSetup: boolean;
  hasFailedPayments: boolean;
};

export type AdminPaymentProvidersResult = {
  providers: AdminPaymentProviderRow[];
  dataSource: "supabase" | "env_missing";
};

type ProviderRow = {
  id: string;
  name: string;
  stripe_account_id: string | null;
  stripe_connect_status: string | null;
  gocardless_status: string | null;
  club_profiles?:
    | { club_name: string }
    | { club_name: string }[]
    | null;
};

const STRIPE_STATUSES: StripeConnectStatus[] = [
  "not_connected",
  "action_required",
  "connected",
  "restricted",
  "payouts_enabled",
];

const GOCARDLESS_STATUSES: GoCardlessConnectionStatus[] = [
  "not_connected",
  "pending_setup",
  "connected",
  "action_required",
  "disconnected",
];

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeStripeStatus(value: string | null | undefined): StripeConnectStatus {
  if (value && STRIPE_STATUSES.includes(value as StripeConnectStatus)) {
    return value as StripeConnectStatus;
  }

  return "not_connected";
}

function normalizeGocardlessStatus(
  value: string | null | undefined,
): GoCardlessConnectionStatus {
  if (value && GOCARDLESS_STATUSES.includes(value as GoCardlessConnectionStatus)) {
    return value as GoCardlessConnectionStatus;
  }

  return "not_connected";
}

function resolveClubName(row: ProviderRow): string {
  const profile = firstRelation(row.club_profiles);
  return profile?.club_name?.trim() || row.name.trim() || "Unnamed club";
}

function resolveNeedsSetup(
  stripeStatus: StripeConnectStatus,
  gocardlessStatus: GoCardlessConnectionStatus,
  stripeAccountId: string | null,
): boolean {
  if (stripeStatus === "action_required" || stripeStatus === "restricted") {
    return true;
  }

  if (
    gocardlessStatus === "pending_setup" ||
    gocardlessStatus === "action_required"
  ) {
    return true;
  }

  if (stripeAccountId && !isStripeConnected(stripeStatus)) {
    return true;
  }

  return false;
}

async function fetchProviderRows(): Promise<ProviderRow[] | null> {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .from("providers")
    .select(
      `
        id,
        name,
        stripe_account_id,
        stripe_connect_status,
        gocardless_status,
        club_profiles (
          club_name
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[Admin payment providers] Failed to load providers:",
      error.message,
    );
    return null;
  }

  return (data ?? []) as unknown as ProviderRow[];
}

async function fetchFailedPaymentProviderIds(): Promise<Set<string>> {
  const supabase = getAdminSupabaseClient();

  // Table exists in Supabase but is not yet in generated Database types.
  const { data, error } = await (
    supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string,
          ) => Promise<{
            data: { provider_id: string }[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    }
  )
    .from("gocardless_payments")
    .select("provider_id")
    .eq("status", "failed");

  if (error) {
    console.error(
      "[Admin payment providers] Failed to load failed payments:",
      error.message,
    );
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.provider_id));
}

function mapProviderRow(
  row: ProviderRow,
  failedProviderIds: Set<string>,
): AdminPaymentProviderRow {
  const stripeStatus = normalizeStripeStatus(row.stripe_connect_status);
  const gocardlessStatus = normalizeGocardlessStatus(row.gocardless_status);

  return {
    providerId: row.id,
    clubName: resolveClubName(row),
    stripeStatus,
    gocardlessStatus,
    needsSetup: resolveNeedsSetup(
      stripeStatus,
      gocardlessStatus,
      row.stripe_account_id,
    ),
    hasFailedPayments: failedProviderIds.has(row.id),
  };
}

export async function fetchAdminPaymentProviders(): Promise<AdminPaymentProvidersResult> {
  if (adminListDataSource() === "env_missing") {
    return { providers: [], dataSource: "env_missing" };
  }

  const [rows, failedProviderIds] = await Promise.all([
    fetchProviderRows(),
    fetchFailedPaymentProviderIds(),
  ]);

  return {
    providers: (rows ?? []).map((row) => mapProviderRow(row, failedProviderIds)),
    dataSource: "supabase",
  };
}

export function isProviderStripeConnected(
  status: ProviderStripeStatus | StripeConnectStatus,
): boolean {
  return isStripeConnected(status as StripeConnectStatus);
}

export function isProviderGoCardlessConnected(status: string): boolean {
  return isGoCardlessConnected(status as GoCardlessConnectionStatus);
}
