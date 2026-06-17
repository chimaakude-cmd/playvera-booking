import { AuthError } from "@supabase/supabase-js";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import type { AdminUserRow } from "./db";
import { rowToAdminUser } from "./db";

export type AdminAuthLoginError =
  | "account_not_found"
  | "password_incorrect"
  | "access_not_active"
  | "auth_not_configured";

export function adminAuthLoginErrorMessage(code: AdminAuthLoginError): string {
  switch (code) {
    case "account_not_found":
      return "Account not found";
    case "password_incorrect":
      return "Password incorrect";
    case "access_not_active":
      return "Admin access not active";
    case "auth_not_configured":
      return "Admin sign-in is not configured. Contact support.";
  }
}

function isEmailAlreadyRegisteredError(error: AuthError): boolean {
  return (
    error.code === "email_exists" ||
    /already (been )?registered|already exists/i.test(error.message)
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

function formatAuthAdminError(error: AuthError | null, fallback: string): string {
  if (!error) {
    return fallback;
  }

  const parts = [error.message];
  if (error.code) {
    parts.push(`(${error.code})`);
  }
  if (error.status) {
    parts.push(`[status ${error.status}]`);
  }

  return parts.join(" ");
}

/**
 * Creates or updates a Supabase Auth user for an invited admin.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server.
 */
export async function ensureSupabaseAuthUserForAdmin(
  email: string,
  password: string,
  role: string,
): Promise<{ authUserId: string } | { error: string }> {
  if (!isSupabaseServiceRoleConfigured()) {
    console.error(
      "[accept-invite] SUPABASE_SERVICE_ROLE_KEY is not configured — cannot create auth user.",
    );
    return {
      error:
        "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseServiceRoleClient();

  try {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { role },
      app_metadata: { role, provider: "email" },
    });

    if (!createError && created.user) {
      console.info("[accept-invite] Created Supabase Auth user:", {
        email: normalizedEmail,
        authUserId: created.user.id,
      });
      return { authUserId: created.user.id };
    }

    if (createError && isEmailAlreadyRegisteredError(createError)) {
      console.info("[accept-invite] Auth user already exists, updating password:", {
        email: normalizedEmail,
      });

      const existingId = await findAuthUserIdByEmail(normalizedEmail);
      if (!existingId) {
        console.error("[accept-invite] Email exists in Auth but listUsers could not find it:", {
          email: normalizedEmail,
        });
        return { error: "Failed to link existing auth account for this email." };
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingId,
        {
          password,
          email_confirm: true,
          user_metadata: { role },
          app_metadata: { role, provider: "email" },
        },
      );

      if (updateError) {
        console.error("[accept-invite] updateUserById failed:", {
          email: normalizedEmail,
          authUserId: existingId,
          message: updateError.message,
          code: updateError.code,
        });
        return { error: formatAuthAdminError(updateError, "Failed to update auth account.") };
      }

      return { authUserId: existingId };
    }

    console.error("[accept-invite] auth.admin.createUser failed:", {
      email: normalizedEmail,
      message: createError?.message,
      code: createError?.code,
      status: createError?.status,
    });
    return {
      error: formatAuthAdminError(createError, "Failed to create auth account."),
    };
  } catch (error) {
    console.error("[accept-invite] ensureSupabaseAuthUserForAdmin threw:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to create auth account.",
    };
  }
}

async function getAdminUserByEmail(email: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? rowToAdminUser(data as AdminUserRow) : null;
}

export type AdminAuthLoginSuccess = {
  ok: true;
  adminUser: ReturnType<typeof rowToAdminUser>;
  authUserId: string;
};

export type AdminAuthLoginResult =
  | AdminAuthLoginSuccess
  | { ok: false; error: AdminAuthLoginError };

/**
 * Authenticates an admin via Supabase Auth and verifies an active admin_users row.
 */
export async function authenticateAdminWithPassword(
  email: string,
  password: string,
): Promise<AdminAuthLoginResult> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "auth_not_configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const adminByEmail = await getAdminUserByEmail(normalizedEmail);

  if (!adminByEmail) {
    return { ok: false, error: "account_not_found" };
  }

  if (adminByEmail.status !== "active") {
    return { ok: false, error: "access_not_active" };
  }

  const authClient = createSupabaseServerClient();

  const { data: authData, error: authError } =
    await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

  if (authError || !authData.user) {
    return { ok: false, error: "password_incorrect" };
  }

  const serviceClient = createSupabaseServiceRoleClient();
  const authUserId = authData.user.id;

  const { data: byAuthId, error: byAuthError } = await serviceClient
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (byAuthError) {
    throw byAuthError;
  }

  let adminRow = byAuthId as AdminUserRow | null;

  if (!adminRow) {
    const { data: byEmail, error: byEmailError } = await serviceClient
      .from("admin_users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (byEmailError) {
      throw byEmailError;
    }

    adminRow = (byEmail as AdminUserRow | null) ?? null;

    if (adminRow && !adminRow.auth_user_id) {
      await serviceClient
        .from("admin_users")
        .update({ auth_user_id: authUserId })
        .eq("id", adminRow.id);
      adminRow = { ...adminRow, auth_user_id: authUserId };
    }
  }

  if (!adminRow) {
    return { ok: false, error: "account_not_found" };
  }

  return {
    ok: true,
    adminUser: rowToAdminUser(adminRow),
    authUserId,
  };
}
