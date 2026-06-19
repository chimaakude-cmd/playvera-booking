import type { AuthError } from "@supabase/supabase-js";
import type { ActivoraSupabaseClient } from "@/lib/supabase";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import type { ClubRole } from "@/lib/club-team";
import type { OrganisationRole } from "@/lib/organisation";
import type { LoginErrorKind } from "./login-messages";
import { mapSupabaseAuthError } from "./login-messages";
import type { AuthUser, UserRole } from "./types";

export type PortalLoginRole = Exclude<UserRole, "admin">;

export type PortalLoginSuccess = {
  ok: true;
  user: AuthUser;
  redirectTo: string;
};

export type PortalLoginFailure = {
  ok: false;
  kind: LoginErrorKind;
};

export type PortalLoginResult = PortalLoginSuccess | PortalLoginFailure;

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

async function resolveUserRoleFromDatabase(
  authUserId: string,
  email: string,
): Promise<UserRole | null> {
  const serviceClient = createSupabaseServiceRoleClient();

  const { data: provider } = await serviceClient
    .from("providers")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (provider?.id) {
    return "club";
  }

  const { data: teamMember } = await serviceClient
    .from("club_team_members")
    .select("id, role")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .maybeSingle();

  if (teamMember?.id) {
    return "club";
  }

  const { data: adminUser } = await serviceClient
    .from("admin_users")
    .select("id, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (adminUser?.id && adminUser.status === "active") {
    return "admin";
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: adminByEmail } = await serviceClient
    .from("admin_users")
    .select("id, status")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (adminByEmail?.id && adminByEmail.status === "active") {
    return "admin";
  }

  return null;
}

async function buildClubAuthUser(
  authUserId: string,
  email: string,
  displayName: string,
): Promise<AuthUser | null> {
  const serviceClient = createSupabaseServiceRoleClient();

  const { data: provider } = await serviceClient
    .from("providers")
    .select("id, name, email")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (provider?.id) {
    return {
      id: authUserId,
      email: email.trim().toLowerCase(),
      name: displayName || provider.name || "Club Owner",
      role: "club",
      clubRole: "owner",
    };
  }

  const { data: teamMember } = await serviceClient
    .from("club_team_members")
    .select("id, first_name, last_name, role, email")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .maybeSingle();

  if (teamMember?.id) {
    const memberName = [teamMember.first_name, teamMember.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: authUserId,
      email: email.trim().toLowerCase(),
      name: memberName || displayName || "Club Team Member",
      role: "club",
      clubRole: (teamMember.role as ClubRole) ?? "staff",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: teamByEmail } = await serviceClient
    .from("club_team_members")
    .select("id, first_name, last_name, role, email, provider_id")
    .eq("email", normalizedEmail)
    .eq("status", "active")
    .maybeSingle();

  if (teamByEmail?.id) {
    const memberName = [teamByEmail.first_name, teamByEmail.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: authUserId,
      email: normalizedEmail,
      name: memberName || displayName || "Club Team Member",
      role: "club",
      clubRole: (teamByEmail.role as ClubRole) ?? "staff",
    };
  }

  return null;
}

function metadataRole(
  user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> },
): UserRole | null {
  const metaRole =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined);

  if (
    metaRole === "parent" ||
    metaRole === "club" ||
    metaRole === "organisation" ||
    metaRole === "admin"
  ) {
    return metaRole;
  }

  return null;
}

function buildParentAuthUser(
  authUserId: string,
  email: string,
  displayName: string,
): AuthUser {
  return {
    id: authUserId,
    email: email.trim().toLowerCase(),
    name: displayName || "Parent",
    role: "parent",
  };
}

function buildOrganisationAuthUser(
  authUserId: string,
  email: string,
  displayName: string,
  organisationRole?: OrganisationRole,
): AuthUser {
  return {
    id: authUserId,
    email: email.trim().toLowerCase(),
    name: displayName || "Organisation Owner",
    role: "organisation",
    organisationRole: organisationRole ?? "owner",
  };
}

export function getPortalDashboardPath(role: PortalLoginRole): string {
  switch (role) {
    case "club":
      return "/club/dashboard";
    case "parent":
      return "/parent/dashboard";
    case "organisation":
      return "/organisation/dashboard";
  }
}

export async function authenticatePortalUser(
  portal: PortalLoginRole,
  email: string,
  password: string,
  supabase: ActivoraSupabaseClient,
): Promise<PortalLoginResult> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return { ok: false, kind: "generic" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

  if (authError || !authData.user) {
    const authUserId = await findAuthUserIdByEmail(normalizedEmail);
    const kind: LoginErrorKind = authUserId
      ? mapSupabaseAuthError(authError as AuthError)
      : "noAccount";

    if (kind === "generic" && authUserId) {
      return { ok: false, kind: "wrongPassword" };
    }

    return { ok: false, kind };
  }

  const authUserId = authData.user.id;
  const displayName =
    (authData.user.user_metadata?.name as string | undefined)?.trim() ||
    (authData.user.user_metadata?.full_name as string | undefined)?.trim() ||
    "";

  const dbRole = await resolveUserRoleFromDatabase(authUserId, normalizedEmail);
  const metaRole = metadataRole(authData.user);
  const resolvedRole = dbRole ?? metaRole;

  if (resolvedRole && resolvedRole !== portal) {
    await supabase.auth.signOut();
    return { ok: false, kind: "wrongPortal" };
  }

  if (portal === "club") {
    const clubUser = await buildClubAuthUser(
      authUserId,
      normalizedEmail,
      displayName,
    );

    if (!clubUser) {
      await supabase.auth.signOut();
      return { ok: false, kind: "noAccount" };
    }

    return {
      ok: true,
      user: clubUser,
      redirectTo: getPortalDashboardPath("club"),
    };
  }

  if (portal === "parent") {
    return {
      ok: true,
      user: buildParentAuthUser(authUserId, normalizedEmail, displayName),
      redirectTo: getPortalDashboardPath("parent"),
    };
  }

  if (portal === "organisation") {
    const orgRole =
      (authData.user.user_metadata?.organisationRole as OrganisationRole | undefined) ??
      "owner";

    return {
      ok: true,
      user: buildOrganisationAuthUser(
        authUserId,
        normalizedEmail,
        displayName,
        orgRole,
      ),
      redirectTo: getPortalDashboardPath("organisation"),
    };
  }

  return { ok: false, kind: "generic" };
}
