import { getGoCardlessConnection } from "@/lib/gocardless/storage";
import { isGoCardlessConnected } from "@/lib/gocardless/types";
import { getStripeConnectState } from "@/lib/stripe-connect/storage";
import type {
  ClubDefaultPaymentProvider,
  PaymentMethodId,
  PaymentProviderSettings,
} from "./types";
import { PAYMENT_PROVIDERS_STORAGE_KEY } from "./types";

export type ClubPaymentModel = "platform_managed" | "club_oauth";

let cachedClubPaymentModel: ClubPaymentModel = "club_oauth";

export function setClubPaymentModel(model: string | null | undefined): void {
  cachedClubPaymentModel =
    model === "club_oauth" ? "club_oauth" : "platform_managed";
}

export function getClubPaymentModel(): ClubPaymentModel {
  return cachedClubPaymentModel;
}

export function isPlatformManagedPayments(): boolean {
  return cachedClubPaymentModel === "platform_managed";
}

const DEFAULT_ENABLED_METHODS: PaymentProviderSettings["enabled_methods"] = {
  stripe_card: true,
  gocardless_direct_debit: false,
  manual_invoice: false,
};

function normalizeEnabledMethods(
  value: Partial<Record<PaymentMethodId, boolean>> | null | undefined,
): PaymentProviderSettings["enabled_methods"] {
  return {
    stripe_card: Boolean(value?.stripe_card ?? DEFAULT_ENABLED_METHODS.stripe_card),
    gocardless_direct_debit: Boolean(
      value?.gocardless_direct_debit ??
        DEFAULT_ENABLED_METHODS.gocardless_direct_debit,
    ),
    manual_invoice: Boolean(
      value?.manual_invoice ?? DEFAULT_ENABLED_METHODS.manual_invoice,
    ),
  };
}

function createDefaultSettings(providerId: string): PaymentProviderSettings {
  const stripe = getStripeConnectState();
  const gocardless = getGoCardlessConnection(providerId);

  return {
    provider_id: providerId,
    stripe_status: stripe.status,
    gocardless_status: gocardless.status,
    preferred_payment_provider: "stripe",
    club_default_provider: "stripe",
    enabled_methods: { ...DEFAULT_ENABLED_METHODS },
    updated_at: new Date().toISOString(),
  };
}

export function syncProviderStatuses(
  settings: PaymentProviderSettings,
): PaymentProviderSettings {
  const stripe = getStripeConnectState();
  const gocardless = getGoCardlessConnection(settings.provider_id);

  return {
    ...settings,
    stripe_status: stripe.status,
    gocardless_status: gocardless.status,
    updated_at: new Date().toISOString(),
  };
}

export function getPaymentProviderSettings(
  providerId?: string,
): PaymentProviderSettings {
  const stripe = getStripeConnectState();
  const id = providerId ?? stripe.providerId;

  if (typeof window === "undefined") {
    return createDefaultSettings(id);
  }

  try {
    const raw = localStorage.getItem(PAYMENT_PROVIDERS_STORAGE_KEY);
    if (!raw) {
      return createDefaultSettings(id);
    }

    const parsed = JSON.parse(raw) as PaymentProviderSettings;
    const rawClubDefault = parsed.club_default_provider;
    const clubDefaultProvider: ClubDefaultPaymentProvider =
      rawClubDefault === "gocardless" ? "gocardless" : "stripe";

    const base = {
      ...createDefaultSettings(id),
      ...parsed,
      provider_id: id,
      club_default_provider: clubDefaultProvider,
      enabled_methods: normalizeEnabledMethods(parsed.enabled_methods),
    };
    return syncProviderStatuses(base);
  } catch {
    return createDefaultSettings(id);
  }
}

export function savePaymentProviderSettings(
  settings: PaymentProviderSettings,
): PaymentProviderSettings {
  const synced = syncProviderStatuses(settings);
  if (typeof window !== "undefined") {
    localStorage.setItem(
      PAYMENT_PROVIDERS_STORAGE_KEY,
      JSON.stringify(synced),
    );
  }
  return synced;
}

export function updateEnabledMethod(
  methodId: keyof PaymentProviderSettings["enabled_methods"],
  enabled: boolean,
  providerId?: string,
): PaymentProviderSettings {
  const current = getPaymentProviderSettings(providerId);
  const next = savePaymentProviderSettings({
    ...current,
    enabled_methods: { ...current.enabled_methods, [methodId]: enabled },
  });
  return next;
}

export function setPreferredPaymentProvider(
  provider: PaymentProviderSettings["preferred_payment_provider"],
  providerId?: string,
): PaymentProviderSettings {
  const current = getPaymentProviderSettings(providerId);
  return savePaymentProviderSettings({
    ...current,
    preferred_payment_provider: provider,
  });
}

export function setClubDefaultPaymentProvider(
  provider: ClubDefaultPaymentProvider,
  providerId?: string,
): PaymentProviderSettings {
  const current = getPaymentProviderSettings(providerId);

  return savePaymentProviderSettings({
    ...current,
    club_default_provider: provider,
    preferred_payment_provider: provider,
  });
}

export function isGoCardlessCheckoutAvailable(providerId?: string): boolean {
  const settings = getPaymentProviderSettings(providerId);
  const gocardless = getGoCardlessConnection(settings.provider_id);
  return (
    settings.enabled_methods.gocardless_direct_debit &&
    isGoCardlessConnected(gocardless.status, gocardless.merchant_id)
  );
}

export function isStripeCheckoutAvailable(providerId?: string): boolean {
  const settings = getPaymentProviderSettings(providerId);
  const stripe = getStripeConnectState();
  return (
    settings.enabled_methods.stripe_card &&
    (stripe.status === "connected" || stripe.status === "payouts_enabled")
  );
}
