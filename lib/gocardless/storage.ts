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
} from "./types";

function createDefaultConnection(providerId: string): GoCardlessConnection {
  return {
    provider_id: providerId,
    organisation_id: null,
    access_token: null,
    merchant_id: null,
    status: "not_connected",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getGoCardlessConnection(
  providerId?: string,
): GoCardlessConnection {
  const id = providerId ?? DEMO_PROVIDER_ID;

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
    return { ...createDefaultConnection(id), ...parsed };
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
): GoCardlessConnection {
  const current = getGoCardlessConnection(providerId);
  const now = new Date().toISOString();
  return saveGoCardlessConnection({
    ...current,
    status,
    organisation_id:
      status === "connected"
        ? current.organisation_id ?? `OR${Date.now().toString(36).toUpperCase()}`
        : current.organisation_id,
    merchant_id:
      status === "connected"
        ? current.merchant_id ?? `MR${Date.now().toString(36).toUpperCase()}`
        : current.merchant_id,
    access_token:
      status === "connected"
        ? current.access_token ?? "mock_gc_access_token"
        : current.access_token,
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

export function createMockGoCardlessPayment(
  bookingId: string,
  providerId: string,
  amount: number,
  activoraFee: number,
  gocardlessFee: number,
  providerNet: number,
): GoCardlessPayment {
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

export async function startGoCardlessOnboarding(
  providerId?: string,
): Promise<{ url: string; mock: boolean }> {
  const id = providerId ?? getGoCardlessConnection().provider_id;

  try {
    const response = await fetch("/api/gocardless/connect/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId: id }),
    });

    if (response.ok) {
      const data = (await response.json()) as { url: string; mock?: boolean };
      updateGoCardlessStatus("pending_setup", id);
      return { url: data.url, mock: data.mock ?? false };
    }
  } catch {
    // fall through to local mock
  }

  updateGoCardlessStatus("pending_setup", id);
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return {
    url: `${base}/club/finance?tab=payment-providers&gocardless=connected`,
    mock: true,
  };
}

export async function testGoCardlessConnection(
  providerId?: string,
): Promise<{ ok: boolean; message: string }> {
  const connection = getGoCardlessConnection(providerId);

  try {
    const response = await fetch("/api/gocardless/connect/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId: connection.provider_id }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        status?: GoCardlessConnectionStatus;
      };
      if (data.status) {
        updateGoCardlessStatus(data.status, connection.provider_id);
      }
      return { ok: data.ok, message: data.message };
    }
  } catch {
    // local mock
  }

  if (connection.status === "connected") {
    return { ok: true, message: "GoCardless connection is active (mock)." };
  }

  if (connection.status === "pending_setup") {
    return {
      ok: false,
      message: "Setup in progress — complete GoCardless onboarding first.",
    };
  }

  return { ok: false, message: "GoCardless is not connected." };
}

export function completeMockGoCardlessOnboarding(
  providerId?: string,
): GoCardlessConnection {
  return updateGoCardlessStatus("connected", providerId);
}
