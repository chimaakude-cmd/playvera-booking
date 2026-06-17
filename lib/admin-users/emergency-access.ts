import { timingSafeEqual } from "node:crypto";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import { rowToAdminUser, type AdminUserRow } from "./db";
import { ensureSupabaseAuthUserForAdmin } from "./supabase-auth";
import type { AdminUser } from "./types";

export const DEFAULT_EMERGENCY_EMAIL = "adminactivora@gmail.com";

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function getEmergencyEmail(): string {
  return (
    process.env.ADMIN_EMERGENCY_EMAIL?.trim().toLowerCase() ||
    DEFAULT_EMERGENCY_EMAIL
  );
}

export function isEmergencyPinConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMERGENCY_PIN?.trim());
}

export function isRepairTokenConfigured(): boolean {
  return Boolean(process.env.ADMIN_REPAIR_TOKEN?.trim());
}

export function validateEmergencyPin(pin: string): boolean {
  const expected = process.env.ADMIN_EMERGENCY_PIN?.trim();
  if (!expected) {
    return false;
  }
  return secretsMatch(pin, expected);
}

export function validateRepairToken(token: string): boolean {
  const expected = process.env.ADMIN_REPAIR_TOKEN?.trim();
  if (!expected) {
    return false;
  }
  return secretsMatch(token, expected);
}

export function validateEmergencyCredentials(
  email: string,
  pin: string,
): boolean {
  if (!isEmergencyPinConfigured()) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== getEmergencyEmail()) {
    return false;
  }

  return validateEmergencyPin(pin);
}

export type RepairAdminAccessResult =
  | { ok: true; adminUser: AdminUser; authUserId: string }
  | { ok: false; error: string };

/**
 * Creates or repairs Supabase Auth + admin_users for emergency recovery.
 */
export async function repairAdminAccessAccount(
  email: string,
  password: string,
): Promise<RepairAdminAccessResult> {
  if (!isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      error:
        "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const authResult = await ensureSupabaseAuthUserForAdmin(
    normalizedEmail,
    trimmedPassword,
    "super_admin",
  );

  if ("error" in authResult) {
    return { ok: false, error: authResult.error };
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();

  const { data: existing, error: lookupError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    console.error("[emergency-access] admin_users lookup failed:", {
      email: normalizedEmail,
      message: lookupError.message,
      code: lookupError.code,
    });
    return { ok: false, error: "Failed to look up admin user." };
  }

  let adminRow: AdminUserRow;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("admin_users")
      .update({
        auth_user_id: authResult.authUserId,
        role: "super_admin",
        status: "active",
        email_verified: true,
        password_hash: null,
        invite_token: null,
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("[emergency-access] admin_users update failed:", {
        email: normalizedEmail,
        message: updateError?.message,
        code: updateError?.code,
      });
      return { ok: false, error: "Failed to update admin user." };
    }

    adminRow = updated as AdminUserRow;
  } else {
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
        auth_user_id: authResult.authUserId,
        accepted_at: now,
        is_owner: false,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      console.error("[emergency-access] admin_users insert failed:", {
        email: normalizedEmail,
        message: insertError?.message,
        code: insertError?.code,
      });
      return { ok: false, error: "Failed to create admin user." };
    }

    adminRow = inserted as AdminUserRow;
  }

  return {
    ok: true,
    adminUser: rowToAdminUser(adminRow),
    authUserId: authResult.authUserId,
  };
}

export async function logEmergencyAccessRecovery(
  adminUser: AdminUser,
  method: "emergency-login" | "repair-access",
): Promise<void> {
  console.info(`[${method}]`, {
    email: adminUser.email,
    adminUserId: adminUser.id,
    timestamp: new Date().toISOString(),
  });

  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("admin_user_audit_log").insert({
      action: "password_changed",
      target_user_id: adminUser.id,
      target_email: adminUser.email,
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      actor_email: adminUser.email,
      details:
        method === "emergency-login"
          ? "Emergency PIN access recovery"
          : "Repair access token recovery",
    });
  } catch (error) {
    console.error(`[${method}] audit log failed:`, error);
  }
}
