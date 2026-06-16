import type { NextRequest } from "next/server";
import type { AdminRole } from "@/lib/admin/types";
import { canManageAdminUsers } from "./permissions";
import type { AdminUserActor } from "./server-store";

const ADMIN_ROLE_HEADER = "x-admin-role";
const ADMIN_EMAIL_HEADER = "x-admin-email";
const ADMIN_ID_HEADER = "x-admin-id";
const ADMIN_NAME_HEADER = "x-admin-name";

const VALID_ROLES: AdminRole[] = [
  "owner",
  "super_admin",
  "support_admin",
  "finance_admin",
  "content_admin",
  "read_only",
];

function parseRole(value: string | null): AdminRole | null {
  if (!value) {
    return null;
  }
  return VALID_ROLES.includes(value as AdminRole) ? (value as AdminRole) : null;
}

/**
 * Resolve the acting admin from request headers.
 * Client components send session fields; production should verify a signed session/JWT.
 */
export function getAdminActorFromRequest(request: NextRequest): AdminUserActor | null {
  const role = parseRole(request.headers.get(ADMIN_ROLE_HEADER));
  const email = request.headers.get(ADMIN_EMAIL_HEADER)?.trim().toLowerCase();
  const adminId = request.headers.get(ADMIN_ID_HEADER)?.trim();
  const name = request.headers.get(ADMIN_NAME_HEADER)?.trim();

  if (!role || !email || !adminId || !name) {
    return null;
  }

  return { adminId, email, name, role };
}

export function requireManageAdminActor(
  request: NextRequest,
): { actor: AdminUserActor } | { error: string; status: number } {
  const actor = getAdminActorFromRequest(request);

  if (!actor) {
    // Dev fallback while admin auth is open — still gated by manage_admins when headers present.
    if (process.env.NODE_ENV !== "production") {
      return {
        actor: {
          adminId: "dev-admin",
          email: "admin@test.activeora.co.uk",
          name: "Dev Admin",
          role: "super_admin",
        },
      };
    }
    return { error: "Admin authentication required.", status: 401 };
  }

  if (!canManageAdminUsers(actor.role)) {
    return { error: "Only Owner or Super Admin can manage admin users.", status: 403 };
  }

  return { actor };
}

export function adminActorHeaders(actor: AdminUserActor): Record<string, string> {
  return {
    [ADMIN_ROLE_HEADER]: actor.role,
    [ADMIN_EMAIL_HEADER]: actor.email,
    [ADMIN_ID_HEADER]: actor.adminId,
    [ADMIN_NAME_HEADER]: actor.name,
  };
}
