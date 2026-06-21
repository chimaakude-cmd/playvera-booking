import { slugifyProviderName } from "@/lib/admin/provider-onboarding";
import { getAdminSupabaseClient } from "@/lib/admin/supabase-client";
import { buildMinimalClubProfilesRowFromProvider } from "@/lib/club-onboarding/profile-mapper";
import { INDEPENDENT_CLUB_ORGANISATION_FIELDS } from "@/lib/organisation/franchise-status";
import { DEFAULT_PLAN_SLUG, getDefaultPlanBySlug } from "@/lib/subscription-plans";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

export type OrphanedClubAuthUser = {
  authUserId: string;
  email: string;
  name: string;
};

export type RepairProviderProfileResult =
  | { ok: true; providerId: string; created: boolean }
  | { ok: false; error: string };

async function resolveUniqueProviderSlug(
  clubName: string,
): Promise<string> {
  const supabase = getAdminSupabaseClient();
  const baseSlug = slugifyProviderName(clubName);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data: existing, error } = await supabase
      .from("providers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!existing) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function findOrphanedClubAuthUsers(): Promise<OrphanedClubAuthUser[]> {
  if (!isSupabaseServiceRoleConfigured()) {
    return [];
  }

  const service = createSupabaseServiceRoleClient();
  const admin = getAdminSupabaseClient();

  const { data: providers, error: providersError } = await admin
    .from("providers")
    .select("auth_user_id");

  if (providersError) {
    console.error(
      "[Admin provider repair] Failed to load providers:",
      providersError.message,
    );
    return [];
  }

  const linkedAuthUserIds = new Set(
    (providers ?? [])
      .map((row) => row.auth_user_id)
      .filter((value): value is string => Boolean(value)),
  );

  const orphaned: OrphanedClubAuthUser[] = [];
  let page = 1;

  while (page <= 10) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      console.error(
        "[Admin provider repair] Failed to list auth users:",
        error.message,
      );
      break;
    }

    for (const user of data.users) {
      const role =
        (user.app_metadata?.role as string | undefined) ??
        (user.user_metadata?.role as string | undefined);

      if (role !== "club") {
        continue;
      }

      if (linkedAuthUserIds.has(user.id)) {
        continue;
      }

      orphaned.push({
        authUserId: user.id,
        email: user.email?.trim() || "—",
        name:
          (user.user_metadata?.name as string | undefined)?.trim() ||
          user.email?.trim() ||
          "Club owner",
      });
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return orphaned;
}

export async function repairProviderProfileForAuthUser(
  authUserId: string,
): Promise<RepairProviderProfileResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      error: "Service role key is required to repair provider profiles.",
    };
  }

  const authUserIdTrimmed = authUserId.trim();
  if (!authUserIdTrimmed) {
    return { ok: false, error: "Auth user id is required." };
  }

  const service = createSupabaseServiceRoleClient();
  const supabase = getAdminSupabaseClient();

  const { data: authUser, error: authError } =
    await service.auth.admin.getUserById(authUserIdTrimmed);

  if (authError || !authUser.user) {
    return {
      ok: false,
      error: authError?.message || "Auth user not found.",
    };
  }

  const { data: existingProvider, error: existingError } = await supabase
    .from("providers")
    .select("id")
    .eq("auth_user_id", authUserIdTrimmed)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }

  if (existingProvider?.id) {
    return { ok: true, providerId: existingProvider.id, created: false };
  }

  const email = authUser.user.email?.trim() || "";
  const displayName =
    (authUser.user.user_metadata?.name as string | undefined)?.trim() ||
    email ||
    "Unnamed club";
  const slug = await resolveUniqueProviderSlug(displayName);
  const freePlan = getDefaultPlanBySlug(DEFAULT_PLAN_SLUG);

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      name: displayName,
      slug,
      email,
      auth_user_id: authUserIdTrimmed,
      ...INDEPENDENT_CLUB_ORGANISATION_FIELDS,
      account_status: "active",
      platform_fee_percent: freePlan.bookingFeePercent,
      payment_model: "platform_managed",
      payments_enabled: true,
      payments_paused: false,
      payout_schedule: "weekly",
      gocardless_status: "not_connected",
      stripe_connect_status: "not_connected",
      payment_method_gocardless_dd: false,
      payment_method_stripe_card: false,
      preferred_payment_provider: "none",
    })
    .select("id")
    .single();

  if (providerError || !provider?.id) {
    return {
      ok: false,
      error: providerError?.message || "Could not create provider row.",
    };
  }

  const providerId = provider.id;
  const profileRow = buildMinimalClubProfilesRowFromProvider(providerId, {
    name: displayName,
    slug,
    email,
  });

  const { error: profileError } = await supabase
    .from("club_profiles")
    .insert(profileRow);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const { error: subscriptionError } = await supabase
    .from("provider_subscriptions")
    .insert({
      provider_id: providerId,
      plan: DEFAULT_PLAN_SLUG,
      status: "active",
    });

  if (subscriptionError) {
    return { ok: false, error: subscriptionError.message };
  }

  const [firstName, ...rest] = displayName.split(/\s+/);
  const lastName = rest.join(" ");

  const { error: ownerError } = await supabase.from("club_team_members").insert({
    provider_id: providerId,
    auth_user_id: authUserIdTrimmed,
    first_name: firstName || "Club",
    last_name: lastName || "Owner",
    email,
    is_owner: true,
    status: "active",
    role: "owner",
  });

  if (ownerError) {
    return { ok: false, error: ownerError.message };
  }

  return { ok: true, providerId, created: true };
}
