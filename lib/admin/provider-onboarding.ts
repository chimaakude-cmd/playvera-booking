import type { ProviderOrganisationType } from "@/lib/admin/organisation-types";
import type { AdminProviderPlanId } from "@/lib/admin/provider-plans";
import { adminPlanToStoredValue } from "@/lib/admin/provider-plans";

export type AdminPaymentSetupOption =
  | "stripe_only"
  | "gocardless_only"
  | "both"
  | "none";

export const ADMIN_PAYMENT_SETUP_OPTIONS: {
  id: AdminPaymentSetupOption;
  label: string;
}[] = [
  { id: "stripe_only", label: "Stripe only" },
  { id: "gocardless_only", label: "GoCardless only" },
  { id: "both", label: "Stripe + GoCardless" },
  { id: "none", label: "No payment provider yet" },
];

const ONBOARDING_PATHS: Record<ProviderOrganisationType, string> = {
  club: "/club/onboarding",
  franchise: "/franchisor/onboarding",
  enterprise: "/enterprise/onboarding",
};

import { resolveServerAppBaseUrl } from "@/lib/app-url";

function appOrigin(): string {
  return resolveServerAppBaseUrl();
}

export function buildPublicOnboardingLink(): string {
  return `${appOrigin()}/get-started`;
}

export function buildProviderOnboardingLink(
  organisationType: ProviderOrganisationType,
  email?: string,
): string {
  const url = new URL(ONBOARDING_PATHS[organisationType], appOrigin());
  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    url.searchParams.set("email", trimmedEmail);
  }
  return url.toString();
}

export function defaultPlanForOrganisationType(
  organisationType: ProviderOrganisationType,
): AdminProviderPlanId {
  if (organisationType === "enterprise") {
    return "ENTERPRISE";
  }

  if (organisationType === "franchise") {
    return "GROWTH";
  }

  return "FREE";
}

export function mapPaymentSetupToProviderFields(setup: AdminPaymentSetupOption): {
  preferred_payment_provider: string;
  payment_method_stripe_card: boolean;
  payment_method_gocardless_dd: boolean;
  stripe_connect_status: string;
  gocardless_status: string;
} {
  switch (setup) {
    case "stripe_only":
      return {
        preferred_payment_provider: "stripe",
        payment_method_stripe_card: true,
        payment_method_gocardless_dd: false,
        stripe_connect_status: "not_connected",
        gocardless_status: "not_connected",
      };
    case "gocardless_only":
      return {
        preferred_payment_provider: "gocardless",
        payment_method_stripe_card: false,
        payment_method_gocardless_dd: true,
        stripe_connect_status: "not_connected",
        gocardless_status: "not_connected",
      };
    case "both":
      return {
        preferred_payment_provider: "stripe",
        payment_method_stripe_card: true,
        payment_method_gocardless_dd: true,
        stripe_connect_status: "not_connected",
        gocardless_status: "not_connected",
      };
    case "none":
      return {
        preferred_payment_provider: "stripe",
        payment_method_stripe_card: false,
        payment_method_gocardless_dd: false,
        stripe_connect_status: "not_connected",
        gocardless_status: "not_connected",
      };
  }
}

export function slugifyProviderName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "provider";
}

export function storedPlanValue(planId: AdminProviderPlanId): string {
  return adminPlanToStoredValue(planId);
}
