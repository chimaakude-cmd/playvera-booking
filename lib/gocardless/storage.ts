import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { buildGoCardlessConnectStartPath } from "@/lib/gocardless/connect-start-path";
import { getClubProfile } from "@/lib/club-profile";
import { getDefaultProviderIdFromEnv } from "@/lib/data/providers/supabase/default-provider";
import { DEMO_PROVIDER_ID } from "@/lib/stripe-connect/types";
import type {
  GoCardlessConnection,
  GoCardlessConnectionStatus,
  GoCardlessPayment,
  GoCardlessPaymentStatus,
} from "./types";
import {
  GOCARDLESS_CONNECTIONS_STORAGE_KEY,
  GOCARDLESS_PAYMENTS_STORAGE_KEY,
  isGoCardlessConnected,
} from "./types";

const PLACEHOLDER_PROVIDER_IDS = new Set(["local-provider", DEMO_PROVIDER_ID]);

function createDefaultConnection(providerId: string): GoCardlessConnection {
  return {
    provider_id: providerId,
    organisation_id: null,
    access_token: null,
    merchant_id: null,
    status: "not_connected",
    connected_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function readCachedDefaultProviderId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("activora-default-provider-id")?.trim() || null;
}

export function resolveGoCardlessProviderId(): string {
  const connection = getGoCardlessConnection();
  const envProviderId = getDefaultProviderIdFromEnv();
  const profileProviderId = getClubProfile().providerId?.trim();
  const cachedProviderId = readCachedDefaultProviderId();

  const resolved =
    (profileProviderId && !PLACEHOLDER_PROVIDER_IDS.has(profileProviderId)
      ? profileProviderId
      : null) ??
    (cachedProviderId && !PLACEHOLDER_PROVIDER_IDS.has(cachedProviderId)
      ? cachedProviderId
      : null) ??
    envProviderId ??
    connection.provider_id;

  if (resolved !== connection.provider_id) {
    saveGoCardlessConnection({
      ...connection,
      provider_id: resolved,
    });
  }

  return resolved;
}

export function getGoCardlessConnection(
  providerId?: string,
): GoCardlessConnection {
  const id = providerId ?? resolveGoCardlessProviderId();

  if (typeof window === "undefined") {
    return createDefaultConnection(id);
  }

  try {
    const raw = localStorage.getItem(GOCARDLESS_CONNECTIONS_STORAGE_KEY);
    if (!raw) {
      return createDefaultConnection(id);
    }

    const parsed = JSON.parse(raw) as GoCardlessConnection;
    if (parsed.provider_id !== id) {
      return createDefaultConnection(id);
    }

    const merged = { ...createDefaultConnection(id), ...parsed };
    if (
      merged.status === "connected" &&
      !merged.merchant_id?.trim()
    ) {
      merged.status = "not_connected";
    }

    return merged;
  } catch {
    return createDefaultConnection(id);
  }
}

export function saveGoCardlessConnection(
  connection: GoCardlessConnection,
): GoCardlessConnection {
  const next = { ...connection, updated_at: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.setItem(
      GOCARDLESS_CONNECTIONS_STORAGE_KEY,
      JSON.stringify(next),
    );
  }
  return next;
}

export function updateGoCardlessStatus(
  status: GoCardlessConnectionStatus,
  providerId?: string,
  details?: Partial<
    Pick<
      GoCardlessConnection,
      "organisation_id" | "merchant_id" | "connected_at" | "access_token"
    >
  >,
): GoCardlessConnection {
  const current = getGoCardlessConnection(providerId);
  const now = new Date().toISOString();

  return saveGoCardlessConnection({
    ...current,
    status,
    organisation_id:
      details?.organisation_id !== undefined
        ? details.organisation_id
        : current.organisation_id,
    merchant_id:
      details?.merchant_id !== undefined
        ? details.merchant_id
        : current.merchant_id,
    access_token:
      details?.access_token !== undefined
        ? details.access_token
        : current.access_token,
    connected_at:
      status === "connected"
        ? details?.connected_at ?? current.connected_at ?? now
        : details?.connected_at ?? null,
    created_at: current.created_at ?? now,
  });
}

export function disconnectGoCardless(providerId?: string): GoCardlessConnection {
  const current = getGoCardlessConnection(providerId);
  return saveGoCardlessConnection({
    ...createDefaultConnection(current.provider_id),
    created_at: current.created_at,
  });
}

export function getGoCardlessPayments(): GoCardlessPayment[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(GOCARDLESS_PAYMENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as GoCardlessPayment[];
  } catch {
    return [];
  }
}

export function saveGoCardlessPayment(payment: GoCardlessPayment): void {
  const payments = getGoCardlessPayments();
  const index = payments.findIndex((p) => p.booking_id === payment.booking_id);
  const next =
    index >= 0
      ? payments.map((p, i) => (i === index ? payment : p))
      : [...payments, payment];

  if (typeof window !== "undefined") {
    localStorage.setItem(
      GOCARDLESS_PAYMENTS_STORAGE_KEY,
      JSON.stringify(next),
    );
  }
}

/** Dev-only mock payment — never used in production. */
export function createMockGoCardlessPayment(
  bookingId: string,
  providerId: string,
  amount: number,
  activoraFee: number,
  gocardlessFee: number,
  providerNet: number,
): GoCardlessPayment | null {
  if (!isDevelopmentEnvironment()) {
    return null;
  }

  const payment: GoCardlessPayment = {
    booking_id: bookingId,
    provider_id: providerId,
    amount,
    activora_fee: activoraFee,
    gocardless_fee: gocardlessFee,
    provider_net: providerNet,
    status: "payment_pending",
    mandate_id: `MD${Date.now().toString(36).toUpperCase()}`,
    payment_id: `PM${Date.now().toString(36).toUpperCase()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveGoCardlessPayment(payment);
  return payment;
}

export async function fetchGoCardlessConnection(
  providerId?: string,
): Promise<GoCardlessConnection> {
  const id = providerId ?? resolveGoCardlessProviderId();

  try {
    const response = await fetch(
      `/api/gocardless/connect/status?providerId=${encodeURIComponent(id)}`,
    );

    if (response.ok) {
      const data = (await response.json()) as {
        providerId: string;
        status: GoCardlessConnectionStatus;
        merchantId: string | null;
        organisationId: string | null;
        connectedAt: string | null;
      };

      const connection = saveGoCardlessConnection({
        ...createDefaultConnection(data.providerId),
        status: data.status,
        merchant_id: data.merchantId,
        organisation_id: data.organisationId,
        connected_at: data.connectedAt,
      });

      return connection;
    }
  } catch {
    // fall through to cached state
  }

  if (!isDevelopmentEnvironment()) {
    return createDefaultConnection(id);
  }

  return getGoCardlessConnection(id);
}

export function startGoCardlessOnboarding(
  providerId?: string,
): { url: string } {
  const id = providerId ?? resolveGoCardlessProviderId();
  updateGoCardlessStatus("pending_setup", id);
  return { url: buildGoCardlessConnectStartPath(id) };
}

export async function testGoCardlessConnection(
  providerId?: string,
): Promise<{ ok: boolean; message: string }> {
  const connection = await fetchGoCardlessConnection(providerId);

  if (isGoCardlessConnected(connection.status, connection.merchant_id)) {
    return {
      ok: true,
      message: "GoCardless connection verified.",
    };
  }

  if (connection.status === "pending_setup") {
    return {
      ok: false,
      message: "Setup in progress — complete GoCardless onboarding first.",
    };
  }

  return { ok: false, message: "GoCardless is not connected." };
}

export async function disconnectGoCardlessRemote(
  providerId?: string,
): Promise<GoCardlessConnection> {
  const id = providerId ?? resolveGoCardlessProviderId();

  try {
    await fetch("/api/gocardless/connect/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId: id }),
    });
  } catch {
    // local cache still cleared below
  }

  return disconnectGoCardless(id);
}

/** @deprecated Dev-only — use OAuth callback in production */
export function completeMockGoCardlessOnboarding(
  providerId?: string,
): GoCardlessConnection | null {
  if (!isDevelopmentEnvironment()) {
    return null;
  }

  return updateGoCardlessStatus("connected", providerId, {
    organisation_id: `OR_DEV_${Date.now().toString(36).toUpperCase()}`,
    merchant_id: `CR_DEV_${Date.now().toString(36).toUpperCase()}`,
    connected_at: new Date().toISOString(),
  });
}
