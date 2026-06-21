import { adminListDataSource, type AdminListDataSource } from "@/lib/admin/data-source";
import type { ProviderOrganisationType } from "@/lib/admin/organisation-types";
import type { AdminProviderPlanId } from "@/lib/admin/provider-plans";
import {
  buildProviderOnboardingLink,
  defaultPlanForOrganisationType,
  mapPaymentSetupToProviderFields,
  slugifyProviderName,
  storedPlanValue,
  type AdminPaymentSetupOption,
} from "@/lib/admin/provider-onboarding";
import { getAdminSupabaseClient } from "@/lib/admin/supabase-client";
import { isSupabaseConfigured } from "@/lib/supabase";

export type CreateAdminProviderInput = {
  clubName: string;
  email?: string;
  ownerName?: string;
  organisationType: ProviderOrganisationType;
  planId?: AdminProviderPlanId;
  paymentSetup: AdminPaymentSetupOption;
};

export type CreateAdminProviderResult =
  | {
      ok: true;
      providerId: string;
      onboardingLink: string;
    }
  | { ok: false; error: string };

function splitOwnerName(ownerName: string | undefined): {
  firstName: string;
  lastName: string;
} {
  const trimmed = ownerName?.trim() ?? "";
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export async function createAdminProvider(
  input: CreateAdminProviderInput,
): Promise<CreateAdminProviderResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const clubName = input.clubName.trim();
  if (!clubName) {
    return { ok: false, error: "Provider name is required." };
  }

  const email = input.email?.trim() || null;
  const organisationType = input.organisationType;
  const planId = input.planId ?? defaultPlanForOrganisationType(organisationType);
  const paymentFields = mapPaymentSetupToProviderFields(input.paymentSetup);
  const baseSlug = slugifyProviderName(clubName);

  const supabase = getAdminSupabaseClient();

  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data: existing } = await supabase
      .from("providers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!existing) {
      slug = candidate;
      break;
    }
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      name: clubName,
      slug,
      email,
      organisation_type: organisationType,
      account_status: "active",
      ...paymentFields,
    })
    .select("id")
    .single();

  if (providerError || !provider?.id) {
    return {
      ok: false,
      error: providerError?.message ?? "Could not create provider.",
    };
  }

  const providerId = provider.id;

  const { error: profileError } = await supabase.from("club_profiles").insert({
    provider_id: providerId,
    club_name: clubName,
    public_slug: slug,
    verified: false,
    website: "",
    short_description: "",
  });

  if (profileError) {
    await supabase.from("providers").delete().eq("id", providerId);
    return { ok: false, error: profileError.message };
  }

  const { error: subscriptionError } = await supabase
    .from("provider_subscriptions")
    .insert({
      provider_id: providerId,
      plan: storedPlanValue(planId),
    });

  if (subscriptionError) {
    await supabase.from("club_profiles").delete().eq("provider_id", providerId);
    await supabase.from("providers").delete().eq("id", providerId);
    return { ok: false, error: subscriptionError.message };
  }

  const { firstName, lastName } = splitOwnerName(input.ownerName);
  const ownerEmail =
    email ??
    `${slug.replace(/[^a-z0-9-]/g, "") || "provider"}@pending.activora.local`;

  if (firstName || lastName || email || input.ownerName?.trim()) {
    const { error: ownerError } = await supabase.from("club_team_members").insert({
      provider_id: providerId,
      first_name: firstName,
      last_name: lastName,
      email: ownerEmail,
      is_owner: true,
      status: "active",
      role: "owner",
    });

    if (ownerError) {
      console.error("[Admin providers] Owner member insert failed:", ownerError.message);
    }
  }

  return {
    ok: true,
    providerId,
    onboardingLink: buildProviderOnboardingLink(organisationType, email ?? undefined),
  };
}

export function getProviderCreateAvailability(): AdminListDataSource {
  return adminListDataSource();
}
