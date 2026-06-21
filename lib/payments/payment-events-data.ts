import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";

export type PaymentEventFilter = "all" | "success" | "pending" | "failed";

export type PaymentEventRow = {
  id: string;
  date: string;
  providerId: string;
  providerName: string;
  provider: "GoCardless";
  amount: number;
  platformFee: number;
  clubPayout: number;
  status: "success" | "pending" | "failed";
  rawStatus: string;
};

const SUCCESS_STATUSES = new Set(["confirmed", "paid_out"]);
const PENDING_STATUSES = new Set(["payment_pending", "pending_mandate", "submitted"]);
const FAILED_STATUSES = new Set(["failed", "cancelled", "charged_back"]);

function mapEventStatus(raw: string): PaymentEventRow["status"] {
  if (SUCCESS_STATUSES.has(raw)) {
    return "success";
  }
  if (FAILED_STATUSES.has(raw)) {
    return "failed";
  }
  if (PENDING_STATUSES.has(raw)) {
    return "pending";
  }
  return "pending";
}

function matchesFilter(
  status: PaymentEventRow["status"],
  filter: PaymentEventFilter,
): boolean {
  if (filter === "all") {
    return true;
  }
  return status === filter;
}

export async function fetchPaymentEvents(options?: {
  limit?: number;
  filter?: PaymentEventFilter;
  providerId?: string;
}): Promise<PaymentEventRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const limit = options?.limit ?? 100;
  const filter = options?.filter ?? "all";
  const supabase = createSupabaseServiceRoleClient();

  let query = supabase
    .from("gocardless_payments")
    .select(
      `
        id,
        provider_id,
        amount,
        gross_amount,
        platform_fee,
        activora_fee,
        net_amount,
        provider_net,
        status,
        created_at,
        providers (
          name,
          club_profiles (
            club_name
          )
        )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.providerId) {
    query = query.eq("provider_id", options.providerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[payment-events] Failed to load events:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const providerRel = row.providers as
        | {
            name: string;
            club_profiles:
              | { club_name: string }
              | { club_name: string }[]
              | null;
          }
        | null;

      const profile = Array.isArray(providerRel?.club_profiles)
        ? providerRel?.club_profiles[0]
        : providerRel?.club_profiles;

      const gross = Number(row.gross_amount ?? row.amount ?? 0);
      const platformFee = Number(row.platform_fee ?? row.activora_fee ?? 0);
      const clubPayout = Number(row.net_amount ?? row.provider_net ?? 0);
      const eventStatus = mapEventStatus(String(row.status ?? "payment_pending"));

      return {
        id: String(row.id),
        date: String(row.created_at),
        providerId: String(row.provider_id),
        providerName:
          profile?.club_name?.trim() ||
          providerRel?.name?.trim() ||
          "Unknown club",
        provider: "GoCardless" as const,
        amount: gross,
        platformFee,
        clubPayout,
        status: eventStatus,
        rawStatus: String(row.status ?? ""),
      };
    })
    .filter((row) => matchesFilter(row.status, filter));
}

export async function fetchClubPaymentMetrics(providerId: string): Promise<{
  hasConfirmedPayment: boolean;
  hasPendingPayout: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { hasConfirmedPayment: false, hasPendingPayout: false };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("gocardless_payments")
    .select("status")
    .eq("provider_id", providerId);

  if (error || !data) {
    return { hasConfirmedPayment: false, hasPendingPayout: false };
  }

  let hasConfirmedPayment = false;
  let hasPendingPayout = false;

  for (const row of data) {
    const status = String(row.status ?? "");
    if (SUCCESS_STATUSES.has(status)) {
      hasConfirmedPayment = true;
    }
    if (PENDING_STATUSES.has(status)) {
      hasPendingPayout = true;
    }
  }

  return { hasConfirmedPayment, hasPendingPayout };
}
