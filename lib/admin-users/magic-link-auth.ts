import type { AdminRole } from "@/lib/admin/types";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import { DEFAULT_EMERGENCY_EMAIL } from "./emergency-access";
import { rowToAdminUser, type AdminUserRow } from "./db";
import type { AdminUser } from "./types";

export const ADMIN_MAGIC_LINK_CALLBACK_PATH = "/admin/auth/callback";

const VALID_ADMIN_ROLES = new Set<AdminRole>([
  "owner",
  "super_admin",
  "support_admin",
  "finance_admin",
  "content_admin",
  "read_only",
]);

export type AdminMagicLinkLookupError =
  | "not_authorised"
  | "inactive"
  | "auth_not_configured";

export function adminMagicLinkLookupErrorMessage(
  code: AdminMagicLinkLookupError,
): string {
  switch (code) {
    case "not_authorised":
      return "This email is not authorised for admin access";
    case "inactive":
      return "Admin account inactive";
    case "auth_not_configured":
      return "Admin sign-in is not configured. Contact support.";
  }
}

export type AdminMagicLinkCallbackError =
  | "link_expired"
  | "not_authorised"
  | "inactive"
  | "invalid_role";

export function adminMagicLinkCallbackErrorMessage(
  code: AdminMagicLinkCallbackError,
): string {
  switch (code) {
    case "link_expired":
      return "Sign-in link expired";
    case "not_authorised":
      return "This email is not authorised for admin access";
    case "inactive":
      return "Admin account inactive";
    case "invalid_role":
      return "This email is not authorised for admin access";
  }
}

async function getAdminUserRowByEmail(email: string): Promise<AdminUserRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as AdminUserRow) : null;
}

/**
 * Pre-send validation: admin_users must exist and be active.
 */
export async function validateAdminEmailForMagicLink(
  email: string,
): Promise<{ ok: true } | { ok: false; error: AdminMagicLinkLookupError }> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "auth_not_configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const adminRow = await getAdminUserRowByEmail(normalizedEmail);

  if (!adminRow) {
    return { ok: false, error: "not_authorised" };
  }

  if (adminRow.status !== "active") {
    return { ok: false, error: "inactive" };
  }

  if (!VALID_ADMIN_ROLES.has(adminRow.role)) {
    return { ok: false, error: "not_authorised" };
  }

  return { ok: true };
}

async function repairMissingAdminRow(
  email: string,
  authUserId: string,
): Promise<AdminUserRow | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== DEFAULT_EMERGENCY_EMAIL) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const localPart = normalizedEmail.split("@")[0] ?? "Admin";
  const displayName =
    localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[._-]/g, " ");

  const { data: inserted, error: insertError } = await supabase
    .from("admin_users")
    .insert({
      name: displayName,
      email: normalizedEmail,
      role: "super_admin",
      status: "active",
      email_verified: true,
      password_hash: null,
      auth_user_id: authUserId,
      accepted_at: now,
      is_owner: false,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    console.error("[magic-link-auth] repair insert failed:", {
      email: normalizedEmail,
      message: insertError?.message,
      code: insertError?.code,
    });
    return null;
  }

  return inserted as AdminUserRow;
}

export type AdminMagicLinkVerifySuccess = {
  ok: true;
  adminUser: AdminUser;
  authUserId: string;
};

export type AdminMagicLinkVerifyResult =
  | AdminMagicLinkVerifySuccess
  | { ok: false; error: AdminMagicLinkCallbackError };

/**
 * Post-auth validation: verify admin_users row, link auth_user_id, repair if needed.
 */
export async function verifyAdminAfterMagicLinkAuth(
  email: string,
  authUserId: string,
): Promise<AdminMagicLinkVerifyResult> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "not_authorised" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const serviceClient = createSupabaseServiceRoleClient();

  const { data: byAuthId, error: byAuthError } = await serviceClient
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (byAuthError) {
    throw byAuthError;
  }

  let linkedRow = (byAuthId as AdminUserRow | null) ?? null;

  if (!linkedRow) {
    const { data: byEmail, error: byEmailError } = await serviceClient
      .from("admin_users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (byEmailError) {
      throw byEmailError;
    }

    linkedRow = (byEmail as AdminUserRow | null) ?? null;

    if (linkedRow && !linkedRow.auth_user_id) {
      const { data: updated, error: updateError } = await serviceClient
        .from("admin_users")
        .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
        .eq("id", linkedRow.id)
        .select("*")
        .single();

      if (updateError || !updated) {
        throw updateError ?? new Error("Failed to link auth user.");
      }

      linkedRow = updated as AdminUserRow;
    }
  }

  if (!linkedRow) {
    const repaired = await repairMissingAdminRow(normalizedEmail, authUserId);
    if (!repaired) {
      return { ok: false, error: "not_authorised" };
    }
    linkedRow = repaired;
  }

  if (linkedRow.status !== "active") {
    return { ok: false, error: "inactive" };
  }

  if (!VALID_ADMIN_ROLES.has(linkedRow.role)) {
    return { ok: false, error: "invalid_role" };
  }

  if (linkedRow.email.trim().toLowerCase() !== normalizedEmail) {
    return { ok: false, error: "not_authorised" };
  }

  return {
    ok: true,
    adminUser: rowToAdminUser(linkedRow),
    authUserId,
  };
}
