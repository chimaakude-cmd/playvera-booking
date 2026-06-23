import { getClubProfile } from "@/lib/club-profile";
import { getDefaultProviderIdFromEnv } from "@/lib/data/providers/supabase/default-provider";
import type { StripeConnectState } from "./types";
import type { StripeConnectErrorCode } from "@/lib/stripe/errors";
import { STRIPE_CONNECT_LOG_PREFIX } from "@/lib/stripe/errors";
import {
  DEMO_PROVIDER_ID,
  STRIPE_CONNECT_STORAGE_KEY,
} from "./types";

export class StripeConnectOnboardError extends Error {
  readonly code: StripeConnectErrorCode;
  readonly adminDetail?: string;
  readonly reason?: string;
  readonly stripeCode?: string;
  readonly providerId?: string;

  constructor(payload: {
    error: string;
    code: StripeConnectErrorCode;
    adminDetail?: string;
    reason?: string;
    stripeCode?: string;
    providerId?: string;
  }) {
    super(payload.error);
    this.name = "StripeConnectOnboardError";
    this.code = payload.code;
    this.adminDetail = payload.adminDetail;
    this.reason = payload.reason;
    this.stripeCode = payload.stripeCode;
    this.providerId = payload.providerId;
  }
}

async function parseOnboardError(response: Response): Promise<never> {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: StripeConnectErrorCode;
    adminDetail?: string;
    reason?: string;
    stripeCode?: string;
    providerId?: string;
  };

  throw new StripeConnectOnboardError({
    error: payload.error ?? "Could not start Stripe onboarding.",
    code: payload.code ?? "transient",
    adminDetail: payload.adminDetail,
    reason: payload.reason,
    stripeCode: payload.stripeCode,
    providerId: payload.providerId,
  });
}

function createDefaultState(): StripeConnectState {
  return {
    providerId: DEMO_PROVIDER_ID,
    stripeAccountId: null,
    status: "not_connected",
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    disabledReason: null,
    requirementsDue: [],
    dashboard: null,
    updatedAt: new Date().toISOString(),
  };
}

const PLACEHOLDER_PROVIDER_IDS = new Set(["local-provider", DEMO_PROVIDER_ID]);

function readCachedDefaultProviderId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("activora-default-provider-id")?.trim() || null;
}

/** Align Stripe Connect state with the signed-in club's provider record. */
export function resolveStripeConnectProviderId(): string {
  const state = getStripeConnectState();
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
    state.providerId;

  if (resolved !== state.providerId) {
    const next: StripeConnectState = {
      ...state,
      providerId: resolved,
      updatedAt: new Date().toISOString(),
    };
    saveStripeConnectState(next);
    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      step: "providerId.sync",
      previousProviderId: state.providerId,
      providerId: resolved,
    });
    return resolved;
  }

  return state.providerId;
}

export function getStripeConnectState(): StripeConnectState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const raw = localStorage.getItem(STRIPE_CONNECT_STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    return { ...createDefaultState(), ...(JSON.parse(raw) as StripeConnectState) };
  } catch {
    return createDefaultState();
  }
}

export function saveStripeConnectState(state: StripeConnectState): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STRIPE_CONNECT_STORAGE_KEY, JSON.stringify(state));
  }
}

export function setStripeAccountId(accountId: string): StripeConnectState {
  const state: StripeConnectState = {
    ...getStripeConnectState(),
    stripeAccountId: accountId,
    updatedAt: new Date().toISOString(),
  };
  saveStripeConnectState(state);
  return state;
}

export function clearStripeConnectState(): StripeConnectState {
  const state = createDefaultState();
  saveStripeConnectState(state);
  return state;
}

export async function fetchStripeConnectStatus(
  stripeAccountId?: string | null,
): Promise<StripeConnectState> {
  const current = getStripeConnectState();
  const providerId = resolveStripeConnectProviderId();
  const accountId = stripeAccountId ?? current.stripeAccountId;

  const params = new URLSearchParams({ providerId });
  if (accountId) {
    params.set("accountId", accountId);
  }

  const response = await fetch(`/api/stripe/connect/status?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: string }).error ?? "Could not load Stripe status.",
    );
  }

  const data = (await response.json()) as StripeConnectState;
  if (data.stripeAccountId) {
    saveStripeConnectState({ ...current, ...data, providerId });
    return { ...current, ...data, providerId };
  }

  saveStripeConnectState({ ...current, ...data, providerId });
  return { ...current, ...data, providerId };
}

export async function startStripeOnboarding(): Promise<{ url: string }> {
  const providerId = resolveStripeConnectProviderId();
  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    step: "onboard.client.start",
    providerId,
    mode: "post",
    route: "/api/provider/stripe/connect",
  });

  const response = await fetch("/api/provider/stripe/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId }),
  });

  if (!response.ok) {
    await parseOnboardError(response);
  }

  const data = (await response.json()) as {
    url?: string;
    onboarding?: { url?: string };
    stripeAccountId?: string;
  };
  const url = data.onboarding?.url ?? data.url;

  if (!url?.trim()) {
    throw new StripeConnectOnboardError({
      error: "Stripe onboarding link was missing from the server response.",
      code: "transient",
    });
  }

  if (data.stripeAccountId) {
    setStripeAccountId(data.stripeAccountId);
  }

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    step: "onboard.client.redirect",
    providerId,
    redirectUrl: url,
  });

  return { url };
}

export async function refreshStripeOnboarding(): Promise<{ url: string }> {
  const providerId = resolveStripeConnectProviderId();
  const current = getStripeConnectState();

  const response = await fetch("/api/provider/stripe/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      providerId,
      stripeAccountId: current.stripeAccountId,
      refresh: true,
    }),
  });

  if (!response.ok) {
    await parseOnboardError(response);
  }

  const data = (await response.json()) as {
    url?: string;
    onboarding?: { url?: string };
    stripeAccountId?: string;
  };
  const url = data.onboarding?.url ?? data.url;

  if (!url?.trim()) {
    throw new StripeConnectOnboardError({
      error: "Stripe onboarding link was missing from the server response.",
      code: "transient",
    });
  }

  if (data.stripeAccountId) {
    setStripeAccountId(data.stripeAccountId);
  }

  return { url };
}

export async function disconnectStripeAccount(): Promise<StripeConnectState> {
  const current = getStripeConnectState();

  if (current.stripeAccountId) {
    await fetch("/api/stripe/connect/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: current.providerId,
        stripeAccountId: current.stripeAccountId,
      }),
    });
  }

  return clearStripeConnectState();
}
