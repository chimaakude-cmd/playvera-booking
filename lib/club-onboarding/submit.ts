import type { PostgrestError } from "@supabase/supabase-js";
import { slugifyProviderName } from "@/lib/admin/provider-onboarding";
import type { ClubProfileInput } from "@/lib/club-profile/types";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import {
  DEFAULT_PLAN_ID,
  getPlanByIdOrDefault,
  type PlanId,
} from "@/src/config/pricing";
import {
  formatOwnerFullLegalName,
  type ClubBusinessType,
  type ClubOnboardingState,
  type OnboardingClub,
  type OnboardingOwner,
  type OnboardingProfile,
} from "./types";
import {
  syncDerivedOnboardingFields,
  validateOnboardingForCompletion,
} from "./validation";
import { buildClubProfileInput } from "./profile-mapper";

export type ClubOnboardingSubmitInput = {
  owner: OnboardingOwner;
  club: OnboardingClub;
  profile: OnboardingProfile;
  planId?: PlanId;
};

export type ClubOnboardingSubmitResult =
  | {
      ok: true;
      providerId: string;
      authUserId: string;
    }
  | { ok: false; error: string };

function logSupabaseError(context: string, error: PostgrestError | null): void {
  if (!error) {
    return;
  }

  console.error(`[club-onboarding] ${context}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function mapBusinessTypeToOrganisationType(
  businessType: ClubBusinessType | "",
): "club" | "franchise" | "enterprise" {
  if (businessType === "franchise") {
    return "franchise";
  }

  return "club";
}

function isEmailAlreadyRegistered(message: string, code?: string): boolean {
  return (
    code === "email_exists" ||
    /already (been )?registered|already exists/i.test(message)
  );
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

function mapProfileToClubProfilesRow(
  providerId: string,
  profileInput: ClubProfileInput,
) {
  return {
    provider_id: providerId,
    logo_url: profileInput.logoUrl,
    cover_image_url: profileInput.coverImageUrl,
    club_name: profileInput.clubName,
    tagline: profileInput.tagline,
    short_description: profileInput.shortDescription,
    established_year: profileInput.establishedYear,
    verified: false,
    contact: profileInput.contact,
    social_links: profileInput.socialLinks,
    verification_status: profileInput.verificationStatus,
    long_description: profileInput.longDescription,
    unique_selling_points: profileInput.uniqueSellingPoints,
    categories: profileInput.categories,
    age_ranges: profileInput.ageRanges,
    accessibility_options: profileInput.accessibilityOptions,
    website: profileInput.contact.website,
    email: profileInput.contact.email,
    phone: profileInput.contact.phone,
    branding: profileInput.branding,
    customer_view: profileInput.customerView,
    media_gallery: profileInput.mediaGallery,
    public_slug: profileInput.publicSlug,
    meta_title: profileInput.metaTitle,
    meta_description: profileInput.metaDescription,
    published: profileInput.published,
  };
}

async function resolveUniqueProviderSlug(
  clubName: string,
): Promise<string> {
  const supabase = createSupabaseServiceRoleClient();
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

async function deleteProviderCascade(providerId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("providers").delete().eq("id", providerId);
}

export async function submitClubOnboardingToSupabase(
  rawInput: ClubOnboardingSubmitInput,
): Promise<ClubOnboardingSubmitResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      error:
        "Club onboarding is not configured for production. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
    };
  }

  const state = syncDerivedOnboardingFields({
    currentStep: 4,
    planId: DEFAULT_PLAN_ID,
    owner: rawInput.owner,
    club: rawInput.club,
    profile: rawInput.profile,
    completedAt: null,
    updatedAt: new Date().toISOString(),
  });

  const validationErrors = validateOnboardingForCompletion(state);
  if (validationErrors.length > 0) {
    return { ok: false, error: validationErrors.join(" ") };
  }

  const authResult = await ensureClubOwnerAuthUser(state.owner);
  if ("error" in authResult) {
    return { ok: false, error: authResult.error };
  }

  const authUserId = authResult.authUserId;
  const clubName = state.club.name.trim();
  const slug = await resolveUniqueProviderSlug(clubName);
  const profileInput = buildClubProfileInput(state);
  const supabase = createSupabaseServiceRoleClient();

  const starterPlan = getPlanByIdOrDefault(DEFAULT_PLAN_ID);

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      name: clubName,
      slug,
      email: state.owner.email.trim(),
      phone: state.owner.phone.trim(),
      auth_user_id: authUserId,
      organisation_type: mapBusinessTypeToOrganisationType(state.club.businessType),
      account_status: "active",
      platform_fee_percent: starterPlan.platformFeePercent,
    })
    .select("id")
    .single();

  if (providerError || !provider?.id) {
    logSupabaseError("club/provider insert failed", providerError);
    return {
      ok: false,
      error:
        providerError?.message ||
        "Could not create your club record. Please try again.",
    };
  }

  const providerId = provider.id;
  console.info("[club-onboarding] club/provider insert result:", {
    success: true,
    providerId,
    slug,
  });

  const { error: profileError } = await supabase.from("club_profiles").insert(
    mapProfileToClubProfilesRow(providerId, profileInput),
  );

  if (profileError) {
    logSupabaseError("profile insert failed", profileError);
    await deleteProviderCascade(providerId);
    return {
      ok: false,
      error:
        profileError.message ||
        "Could not save your club profile. Please try again.",
    };
  }

  console.info("[club-onboarding] profile insert result:", {
    success: true,
    providerId,
    publicSlug: profileInput.publicSlug,
  });

  const { error: subscriptionError } = await supabase
    .from("provider_subscriptions")
    .insert({
      provider_id: providerId,
      plan: DEFAULT_PLAN_ID,
      status: "active",
    });

  if (subscriptionError) {
    logSupabaseError("provider subscription insert failed", subscriptionError);
    await deleteProviderCascade(providerId);
    return {
      ok: false,
      error:
        subscriptionError.message ||
        "Could not save your subscription plan. Please try again.",
    };
  }

  console.info("[club-onboarding] provider subscription insert result:", {
    success: true,
    providerId,
    plan: DEFAULT_PLAN_ID,
    status: "active",
    platformFeePercent: starterPlan.platformFeePercent,
  });

  const { error: ownerError } = await supabase.from("club_team_members").insert({
    provider_id: providerId,
    auth_user_id: authUserId,
    first_name: state.owner.firstName.trim(),
    last_name: [state.owner.middleName.trim(), state.owner.lastName.trim()]
      .filter(Boolean)
      .join(" "),
    email: state.owner.email.trim(),
    is_owner: true,
    status: "active",
    role: "owner",
  });

  if (ownerError) {
    logSupabaseError("club team owner insert failed", ownerError);
    await deleteProviderCascade(providerId);
    return {
      ok: false,
      error:
        ownerError.message ||
        "Could not save your owner account. Please try again.",
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
