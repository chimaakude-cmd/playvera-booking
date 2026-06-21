import type { PostgrestError } from "@supabase/supabase-js";
import { slugifyProviderName } from "@/lib/admin/provider-onboarding";
import type { ActivoraSupabaseClient } from "@/lib/supabase";
import {
  createSupabaseAuthenticatedClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import {
  INDEPENDENT_CLUB_ORGANISATION_FIELDS,
} from "@/lib/organisation/franchise-status";
import { DEFAULT_PLAN_ID, type PlanId } from "@/src/config/pricing";
import { DEFAULT_PLAN_SLUG, getDefaultPlanBySlug } from "@/lib/subscription-plans";
import {
  formatOwnerFullLegalName,
  type ClubOnboardingState,
  type OnboardingClub,
  type OnboardingOwner,
  type OnboardingProfile,
} from "./types";
import {
  createInitialOnboardingState,
  syncDerivedOnboardingFields,
  validateOnboardingForCompletion,
} from "./validation";
import {
  buildMinimalClubProfilesRow,
  type MinimalClubProfilesRow,
} from "./profile-mapper";

export type ClubOnboardingSubmitInput = {
  owner: OnboardingOwner;
  club: OnboardingClub;
  /** Ignored on submit — full profile is edited in club dashboard settings. */
  profile?: OnboardingProfile;
  planId?: PlanId;
};

export type ClubOnboardingSubmitStep =
  | "Create sign-in account"
  | "Create club record"
  | "Save club profile"
  | "Save subscription plan"
  | "Save owner account";

export type ClubOnboardingSubmitResult =
  | {
      ok: true;
      providerId: string;
      authUserId: string;
      publicSlug: string;
    }
  | { ok: false; error: string; step: ClubOnboardingSubmitStep };

function logSupabaseError(
  context: string,
  error: PostgrestError | null,
): void {
  if (!error) {
    return;
  }

  const isRlsOrAuth =
    error.code === "42501" ||
    /permission denied|row-level security|policy/i.test(error.message);

  console.error(`[club-onboarding] ${context}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    ...(isRlsOrAuth ? { rlsOrAuth: true } : {}),
  });
}

function formatStepError(
  step: ClubOnboardingSubmitStep,
  message: string,
): string {
  return `${step}: ${message}`;
}


function isEmailAlreadyRegistered(message: string, code?: string): boolean {
  return (
    code === "email_exists" ||
    /already (been )?registered|already exists/i.test(message)
  );
}

function isUniqueViolation(error: PostgrestError | null): boolean {
  return error?.code === "23505";
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

async function ensureClubOwnerAuthUser(
  owner: OnboardingOwner,
): Promise<{ authUserId: string } | { error: string }> {
  const normalizedEmail = owner.email.trim().toLowerCase();
  const password = owner.password;
  const displayName = formatOwnerFullLegalName(owner) || "Club Owner";

  if (!password.trim()) {
    return { error: "Password is required to create your club account." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role: "club",
      name: displayName,
    },
    app_metadata: {
      role: "club",
      provider: "email",
    },
  });

  if (!createError && created.user) {
    console.info("[club-onboarding] auth user creation result:", {
      success: true,
      authUserId: created.user.id,
      email: normalizedEmail,
    });
    return { authUserId: created.user.id };
  }

  if (createError && isEmailAlreadyRegistered(createError.message, createError.code)) {
    const existingId = await findAuthUserIdByEmail(normalizedEmail);
    if (!existingId) {
      console.error("[club-onboarding] auth user creation result:", {
        success: false,
        reason: "email_exists_but_not_found",
        email: normalizedEmail,
      });
      return {
        error:
          "An account with this email already exists. Sign in at /club/login or use a different email.",
      };
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingId,
      {
        password,
        email_confirm: true,
        user_metadata: {
          role: "club",
          name: displayName,
        },
        app_metadata: {
          role: "club",
          provider: "email",
        },
      },
    );

    if (updateError) {
      console.error("[club-onboarding] auth user update result:", {
        success: false,
        authUserId: existingId,
        message: updateError.message,
        code: updateError.code,
      });
      return {
        error:
          updateError.message ||
          "Could not link your account. Try signing in at /club/login.",
      };
    }

    console.info("[club-onboarding] auth user creation result:", {
      success: true,
      authUserId: existingId,
      email: normalizedEmail,
      linkedExisting: true,
    });
    return { authUserId: existingId };
  }

  console.error("[club-onboarding] auth user creation result:", {
    success: false,
    message: createError?.message,
    code: createError?.code,
    status: createError?.status,
  });

  return {
    error:
      createError?.message ||
      "Could not create your sign-in account. Please try again.",
  };
}

async function signInClubOwnerForOnboarding(
  email: string,
  password: string,
): Promise<{ accessToken: string } | { error: string }> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.session?.access_token) {
    console.error("[club-onboarding] owner sign-in failed:", {
      message: error?.message,
      code: error?.code,
    });
    return {
      error:
        error?.message ||
        "Could not sign in as the new club owner. Please try again.",
    };
  }

  return { accessToken: data.session.access_token };
}

async function createOnboardingDatabaseClient(
  email: string,
  password: string,
): Promise<
  | { client: ActivoraSupabaseClient; mode: "authenticated" | "service_role" }
  | { error: string }
> {
  const signIn = await signInClubOwnerForOnboarding(email, password);
  if ("error" in signIn) {
    if (!isSupabaseServiceRoleConfigured()) {
      return { error: signIn.error };
    }

    console.warn(
      "[club-onboarding] Falling back to service role for database writes after sign-in failure.",
    );
    return {
      client: createSupabaseServiceRoleClient(),
      mode: "service_role",
    };
  }

  return {
    client: createSupabaseAuthenticatedClient(signIn.accessToken),
    mode: "authenticated",
  };
}

async function resolveUniqueProviderSlug(
  supabase: ActivoraSupabaseClient,
  clubName: string,
): Promise<string> {
  const baseSlug = slugifyProviderName(clubName);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data: existing, error } = await supabase
      .from("providers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      logSupabaseError("slug lookup failed", error);
      throw new Error(error.message);
    }

    if (!existing) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

function independentClubProviderFields() {
  return { ...INDEPENDENT_CLUB_ORGANISATION_FIELDS };
}

async function ensureProviderForOwner(
  supabase: ActivoraSupabaseClient,
  authUserId: string,
  clubName: string,
  owner: OnboardingOwner,
): Promise<
  | { ok: true; providerId: string; slug: string; created: boolean }
  | { ok: false; error: PostgrestError | null }
> {
  const independentFields = independentClubProviderFields();

  const { data: existing, error: existingError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError };
  }

  if (existing?.id) {
    const { error: resetError } = await supabase
      .from("providers")
      .update(independentFields)
      .eq("id", existing.id);

    if (resetError) {
      return { ok: false, error: resetError };
    }

    console.info("[club-onboarding] reusing existing provider for auth user:", {
      providerId: existing.id,
      authUserId,
      independentClub: true,
    });
    return {
      ok: true,
      providerId: existing.id,
      slug: existing.slug ?? slugifyProviderName(clubName),
      created: false,
    };
  }

  const slug = await resolveUniqueProviderSlug(supabase, clubName);
  const freePlan = getDefaultPlanBySlug(DEFAULT_PLAN_SLUG);

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      name: clubName,
      slug,
      email: owner.email.trim(),
      phone: owner.phone.trim(),
      auth_user_id: authUserId,
      ...independentFields,
      account_status: "active",
      platform_fee_percent: freePlan.bookingFeePercent,
      payment_model: "platform_managed",
      payments_enabled: true,
      payments_paused: false,
      payout_schedule: "weekly",
      gocardless_status: "connected",
      payment_method_gocardless_dd: true,
      preferred_payment_provider: "gocardless",
    })
    .select("id")
    .single();

  if (providerError || !provider?.id) {
    if (isUniqueViolation(providerError)) {
      const { data: raced } = await supabase
        .from("providers")
        .select("id, slug")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (raced?.id) {
        return {
          ok: true,
          providerId: raced.id,
          slug: raced.slug ?? slug,
          created: false,
        };
      }
    }

    return { ok: false, error: providerError };
  }

  return {
    ok: true,
    providerId: provider.id,
    slug,
    created: true,
  };
}

async function ensureClubProfile(
  supabase: ActivoraSupabaseClient,
  row: MinimalClubProfilesRow,
): Promise<{ ok: true } | { ok: false; error: PostgrestError | null }> {
  const providerId = row.provider_id;

  const { data: existing, error: existingError } = await supabase
    .from("club_profiles")
    .select("id")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("club_profiles")
      .update(row)
      .eq("provider_id", providerId);

    if (updateError) {
      return { ok: false, error: updateError };
    }

    return { ok: true };
  }

  const { error: insertError } = await supabase.from("club_profiles").insert(row);

  if (insertError && isUniqueViolation(insertError)) {
    const { error: updateError } = await supabase
      .from("club_profiles")
      .update(row)
      .eq("provider_id", providerId);

    if (!updateError) {
      return { ok: true };
    }

    return { ok: false, error: updateError };
  }

  if (insertError) {
    return { ok: false, error: insertError };
  }

  return { ok: true };
}

async function ensureProviderSubscription(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<{ ok: true } | { ok: false; error: PostgrestError | null }> {
  const { data: existing, error: existingError } = await supabase
    .from("provider_subscriptions")
    .select("id")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("provider_subscriptions")
      .update({
        plan: DEFAULT_PLAN_SLUG,
        status: "active",
      })
      .eq("provider_id", providerId);

    if (updateError) {
      return { ok: false, error: updateError };
    }

    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from("provider_subscriptions")
    .insert({
      provider_id: providerId,
      plan: DEFAULT_PLAN_SLUG,
      status: "active",
    });

  if (insertError && isUniqueViolation(insertError)) {
    const { error: updateError } = await supabase
      .from("provider_subscriptions")
      .update({
        plan: DEFAULT_PLAN_SLUG,
        status: "active",
      })
      .eq("provider_id", providerId);

    if (!updateError) {
      return { ok: true };
    }

    return { ok: false, error: updateError };
  }

  if (insertError) {
    return { ok: false, error: insertError };
  }

  return { ok: true };
}

async function ensureOwnerTeamMember(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  authUserId: string,
  owner: OnboardingOwner,
): Promise<{ ok: true } | { ok: false; error: PostgrestError | null }> {
  const ownerEmail = owner.email.trim();
  const ownerRow = {
    provider_id: providerId,
    auth_user_id: authUserId,
    first_name: owner.firstName.trim(),
    last_name: [owner.middleName.trim(), owner.lastName.trim()]
      .filter(Boolean)
      .join(" "),
    email: ownerEmail,
    is_owner: true,
    status: "active" as const,
    role: "owner" as const,
  };

  const { data: existing, error: existingError } = await supabase
    .from("club_team_members")
    .select("id")
    .eq("provider_id", providerId)
    .eq("email", ownerEmail)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("club_team_members")
      .update(ownerRow)
      .eq("id", existing.id);

    if (updateError) {
      return { ok: false, error: updateError };
    }

    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from("club_team_members")
    .insert(ownerRow);

  if (insertError && isUniqueViolation(insertError)) {
    const { error: updateError } = await supabase
      .from("club_team_members")
      .update(ownerRow)
      .eq("provider_id", providerId)
      .eq("email", ownerEmail);

    if (!updateError) {
      return { ok: true };
    }

    return { ok: false, error: updateError };
  }

  if (insertError) {
    return { ok: false, error: insertError };
  }

  return { ok: true };
}

export async function submitClubOnboardingToSupabase(
  rawInput: ClubOnboardingSubmitInput,
): Promise<ClubOnboardingSubmitResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      step: "Create club record",
      error: formatStepError(
        "Create club record",
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      ),
    };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      step: "Create sign-in account",
      error: formatStepError(
        "Create sign-in account",
        "Club onboarding is not configured for production. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
      ),
    };
  }

  const state = syncDerivedOnboardingFields({
    currentStep: 4,
    planId: DEFAULT_PLAN_ID,
    owner: rawInput.owner,
    club: rawInput.club,
    profile: rawInput.profile ?? createInitialOnboardingState().profile,
    completedAt: null,
    updatedAt: new Date().toISOString(),
  });

  const validationErrors = validateOnboardingForCompletion(state);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      step: "Create club record",
      error: validationErrors.join(" "),
    };
  }

  const authResult = await ensureClubOwnerAuthUser(state.owner);
  if ("error" in authResult) {
    return {
      ok: false,
      step: "Create sign-in account",
      error: formatStepError("Create sign-in account", authResult.error),
    };
  }

  const authUserId = authResult.authUserId;
  const clubName = state.club.name.trim();
  const freePlan = getDefaultPlanBySlug(DEFAULT_PLAN_SLUG);

  const dbClientResult = await createOnboardingDatabaseClient(
    state.owner.email,
    state.owner.password,
  );

  if ("error" in dbClientResult) {
    return {
      ok: false,
      step: "Create sign-in account",
      error: formatStepError("Create sign-in account", dbClientResult.error),
    };
  }

  const { client: supabase, mode: dbClientMode } = dbClientResult;
  console.info("[club-onboarding] database client mode:", dbClientMode);

  const providerResult = await ensureProviderForOwner(
    supabase,
    authUserId,
    clubName,
    state.owner,
  );

  if (!providerResult.ok) {
    logSupabaseError("club/provider insert failed", providerResult.error);
    return {
      ok: false,
      step: "Create club record",
      error: formatStepError(
        "Create club record",
        providerResult.error?.message ||
          "Could not create your club record. Please try again.",
      ),
    };
  }

  const { providerId, slug, created: providerCreated } = providerResult;
  console.info("[club-onboarding] club/provider insert result:", {
    success: true,
    providerId,
    slug,
    providerCreated,
    authUserId,
    dbClientMode,
  });

  const clubProfileRow = buildMinimalClubProfilesRow(providerId, slug, state);
  const profileResult = await ensureClubProfile(supabase, clubProfileRow);

  if (!profileResult.ok) {
    logSupabaseError("profile insert failed", profileResult.error);
    return {
      ok: false,
      step: "Save club profile",
      error: formatStepError(
        "Save club profile",
        profileResult.error?.message ||
          "Could not save your club profile. Please try again.",
      ),
    };
  }

  const { error: slugSyncError } = await supabase
    .from("providers")
    .update({ slug: clubProfileRow.public_slug })
    .eq("id", providerId);

  if (slugSyncError) {
    logSupabaseError("provider slug sync failed", slugSyncError);
    return {
      ok: false,
      step: "Save club profile",
      error: formatStepError(
        "Save club profile",
        slugSyncError.message ||
          "Could not sync your public club URL. Please try again.",
      ),
    };
  }

  console.info("[club-onboarding] profile insert result:", {
    success: true,
    providerId,
    publicSlug: clubProfileRow.public_slug,
    published: clubProfileRow.published,
    visibility: clubProfileRow.visibility,
  });

  const subscriptionResult = await ensureProviderSubscription(supabase, providerId);

  if (!subscriptionResult.ok) {
    logSupabaseError(
      "provider subscription insert failed",
      subscriptionResult.error,
    );
    return {
      ok: false,
      step: "Save subscription plan",
      error: formatStepError(
        "Save subscription plan",
        subscriptionResult.error?.message ||
          "Could not save your subscription plan. Please try again.",
      ),
    };
  }

  console.info("[club-onboarding] provider subscription insert result:", {
    success: true,
    providerId,
    plan: DEFAULT_PLAN_SLUG,
    status: "active",
    platformFeePercent: freePlan.bookingFeePercent,
  });

  const ownerResult = await ensureOwnerTeamMember(
    supabase,
    providerId,
    authUserId,
    state.owner,
  );

  if (!ownerResult.ok) {
    logSupabaseError("club team owner insert failed", ownerResult.error);
    return {
      ok: false,
      step: "Save owner account",
      error: formatStepError(
        "Save owner account",
        ownerResult.error?.message ||
          "Could not save your owner account. Please try again.",
      ),
    };
  }

  console.info("[club-onboarding] club team owner insert result:", {
    success: true,
    providerId,
    authUserId,
  });

  return {
    ok: true,
    providerId,
    authUserId,
    publicSlug: clubProfileRow.public_slug,
  };
}

export function toClubOnboardingSubmitInput(
  state: ClubOnboardingState,
): ClubOnboardingSubmitInput {
  const synced = syncDerivedOnboardingFields(state);

  return {
    owner: synced.owner,
    club: synced.club,
    profile: synced.profile,
    planId: DEFAULT_PLAN_ID,
  };
}
