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

export type RepairProviderByIdResult =
  | { ok: true; providerId: string; repaired: string[] }
  | { ok: false; error: string };

export type ProviderLifecycleActionResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

async function ensureProviderSubscriptionForRepair(
  supabase: ReturnType<typeof getAdminSupabaseClient>,
  providerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing, error: lookupError } = await supabase
    .from("provider_subscriptions")
    .select("id")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: lookupError.message };
  }

  if (existing?.id) {
    return { ok: true };
  }

  const { error } = await supabase.from("provider_subscriptions").insert({
    provider_id: providerId,
    plan: DEFAULT_PLAN_SLUG,
    status: "active",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function repairProviderById(
  providerId: string,
): Promise<RepairProviderByIdResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const providerIdTrimmed = providerId.trim();
  if (!providerIdTrimmed) {
    return { ok: false, error: "Provider id is required." };
  }

  const supabase = getAdminSupabaseClient();
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, email, auth_user_id")
    .eq("id", providerIdTrimmed)
    .maybeSingle();

  if (providerError) {
    return { ok: false, error: providerError.message };
  }

  if (!provider?.id) {
    return { ok: false, error: "Provider not found." };
  }

  const repaired: string[] = [];
  const displayName = provider.name?.trim() || "Unnamed club";
  const email = provider.email?.trim() || "";
  const slug =
    provider.slug?.trim() || (await resolveUniqueProviderSlug(displayName));

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("club_profiles")
    .select("id")
    .eq("provider_id", providerIdTrimmed)
    .maybeSingle();

  if (profileLookupError) {
    return { ok: false, error: profileLookupError.message };
  }

  if (!existingProfile?.id) {
    const profileRow = buildMinimalClubProfilesRowFromProvider(providerIdTrimmed, {
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

    repaired.push("club profile");
  } else {
    const { error: slugSyncError } = await supabase
      .from("club_profiles")
      .update({
        public_slug: slug,
        published: true,
        visibility: "published",
        published_at: new Date().toISOString(),
      })
      .eq("provider_id", providerIdTrimmed);

    if (slugSyncError) {
      return { ok: false, error: slugSyncError.message };
    }

    repaired.push("club profile slug");
  }

  const { error: providerSlugError } = await supabase
    .from("providers")
    .update({ slug })
    .eq("id", providerIdTrimmed);

  if (providerSlugError) {
    return { ok: false, error: providerSlugError.message };
  }

  const { data: existingSubscription, error: subscriptionLookupError } =
    await supabase
      .from("provider_subscriptions")
      .select("id")
      .eq("provider_id", providerIdTrimmed)
      .maybeSingle();

  if (subscriptionLookupError) {
    return { ok: false, error: subscriptionLookupError.message };
  }

  if (!existingSubscription?.id) {
    const subscriptionResult = await ensureProviderSubscriptionForRepair(
      supabase,
      providerIdTrimmed,
    );

    if (!subscriptionResult.ok) {
      return subscriptionResult;
    }

    repaired.push("subscription");
  }

  const { data: ownerMember, error: ownerLookupError } = await supabase
    .from("club_team_members")
    .select("id")
    .eq("provider_id", providerIdTrimmed)
    .eq("is_owner", true)
    .maybeSingle();

  if (ownerLookupError) {
    return { ok: false, error: ownerLookupError.message };
  }

  if (!ownerMember?.id && provider.auth_user_id) {
    const [firstName, ...rest] = displayName.split(/\s+/);
    const lastName = rest.join(" ");

    const { error: ownerError } = await supabase.from("club_team_members").insert({
      provider_id: providerIdTrimmed,
      auth_user_id: provider.auth_user_id,
      first_name: firstName || "Club",
      last_name: lastName || "Owner",
      email: email || "owner@example.com",
      is_owner: true,
      status: "active",
      role: "owner",
    });

    if (ownerError) {
      return { ok: false, error: ownerError.message };
    }

    repaired.push("owner");
  } else if (!ownerMember?.id) {
    return {
      ok: false,
      error: "Cannot repair owner without a linked auth user.",
    };
  }

  if (provider.auth_user_id) {
    const { error: activateError } = await supabase
      .from("providers")
      .update({
        onboarding_completed: true,
        lifecycle_status: "active",
      })
      .eq("id", providerIdTrimmed);

    if (activateError && !activateError.message.includes("lifecycle_status")) {
      return { ok: false, error: activateError.message };
    }
  }

  return {
    ok: true,
    providerId: providerIdTrimmed,
    repaired: repaired.length > 0 ? repaired : ["verified existing records"],
  };
}

export async function markProviderAbandoned(
  providerId: string,
): Promise<ProviderLifecycleActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const providerIdTrimmed = providerId.trim();
  if (!providerIdTrimmed) {
    return { ok: false, error: "Provider id is required." };
  }

  const supabase = getAdminSupabaseClient();
  const { error } = await supabase
    .from("providers")
    .update({
      lifecycle_status: "abandoned",
      onboarding_completed: false,
    })
    .eq("id", providerIdTrimmed);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, providerId: providerIdTrimmed };
}

export async function markProviderDeleted(
  providerId: string,
): Promise<ProviderLifecycleActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const providerIdTrimmed = providerId.trim();
  if (!providerIdTrimmed) {
    return { ok: false, error: "Provider id is required." };
  }

  const supabase = getAdminSupabaseClient();
  const { error } = await supabase
    .from("providers")
    .update({
      lifecycle_status: "deleted",
      onboarding_completed: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", providerIdTrimmed);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, providerId: providerIdTrimmed };
}
