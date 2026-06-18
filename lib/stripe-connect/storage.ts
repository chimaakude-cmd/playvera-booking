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

  constructor(payload: {
    error: string;
    code: StripeConnectErrorCode;
    adminDetail?: string;
  }) {
    super(payload.error);
    this.name = "StripeConnectOnboardError";
    this.code = payload.code;
    this.adminDetail = payload.adminDetail;
  }
}

async function parseOnboardError(response: Response): Promise<never> {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: StripeConnectErrorCode;
    adminDetail?: string;
  };

  throw new StripeConnectOnboardError({
    error: payload.error ?? "Could not start Stripe onboarding.",
    code: payload.code ?? "transient",
    adminDetail: payload.adminDetail,
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
  const accountId = stripeAccountId ?? current.stripeAccountId;

  if (!accountId) {
    return current;
  }

  const response = await fetch(
    `/api/stripe/connect/status?accountId=${encodeURIComponent(accountId)}&providerId=${encodeURIComponent(current.providerId)}`,
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: string }).error ?? "Could not load Stripe status.",
    );
  }

  const data = (await response.json()) as StripeConnectState;
  saveStripeConnectState(data);
  return data;
}

function parseOnboardSuccess(payload: {
  url?: string;
  stripeAccountId?: string;
}): { url: string; stripeAccountId: string } {
  const url = payload.url?.trim();
  const stripeAccountId = payload.stripeAccountId?.trim();

  if (!url) {
    console.error(STRIPE_CONNECT_LOG_PREFIX, {
      step: "onboard.client.missing_url",
      stripeAccountId: stripeAccountId ?? null,
    });
    throw new StripeConnectOnboardError({
      error: "Stripe onboarding link was missing. Please try again.",
      code: "transient",
      adminDetail: "POST /api/stripe/connect/onboard returned no url.",
    });
  }

  if (!stripeAccountId) {
    console.error(STRIPE_CONNECT_LOG_PREFIX, {
      step: "onboard.client.missing_account",
      redirectUrl: url,
    });
    throw new StripeConnectOnboardError({
      error: "Stripe account id was missing. Please try again.",
      code: "transient",
      adminDetail: "POST /api/stripe/connect/onboard returned no stripeAccountId.",
    });
  }

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    step: "onboard.client.redirect",
    redirectUrl: url,
    stripeAccountId,
  });

  return { url, stripeAccountId };
}

export async function startStripeOnboarding(): Promise<{
  url: string;
  stripeAccountId: string;
}> {
  const providerId = resolveStripeConnectProviderId();
  const current = getStripeConnectState();

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    step: "onboard.client.start",
    providerId,
    stripeAccountId: current.stripeAccountId,
  });

  const response = await fetch("/api/stripe/connect/onboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      providerId,
      stripeAccountId: current.stripeAccountId,
    }),
  });

  if (!response.ok) {
    await parseOnboardError(response);
  }

  const data = parseOnboardSuccess(
    (await response.json()) as {
      url?: string;
      stripeAccountId?: string;
    },
  );

  setStripeAccountId(data.stripeAccountId);
  return data;
}

export async function refreshStripeOnboarding(): Promise<{ url: string }> {
  const providerId = resolveStripeConnectProviderId();
  const current = getStripeConnectState();

  if (!current.stripeAccountId) {
    throw new Error("No Stripe account to refresh.");
  }

  const response = await fetch("/api/stripe/connect/onboard", {
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

  return parseOnboardSuccess(
    (await response.json()) as {
      url?: string;
      stripeAccountId?: string;
    },
  );
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
