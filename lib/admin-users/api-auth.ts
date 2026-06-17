import type { NextRequest } from "next/server";
import type { AdminRole } from "@/lib/admin/types";
import { canManageActivitiesAdmin } from "@/lib/admin/permissions";
import { adminActorHeaders } from "./actor-headers";
import { canManageAdminUsers } from "./permissions";
import { resolveVerifiedAdminActor } from "./server-auth";
import type { AdminUserActor } from "./server-store";

export { adminActorHeaders };

/**
 * Resolve the acting admin from a verified Supabase session + admin_users row.
 */
export async function getAdminActorFromRequest(
  request: NextRequest,
): Promise<AdminUserActor | null> {
  return resolveVerifiedAdminActor(request);
}

export async function requireManageAdminActor(
  request: NextRequest,
): Promise<{ actor: AdminUserActor } | { error: string; status: number }> {
  const actor = await getAdminActorFromRequest(request);

  if (!actor) {
    return { error: "Admin authentication required.", status: 401 };
  }

  if (!canManageAdminUsers(actor.role)) {
    return { error: "Only Owner or Super Admin can manage admin users.", status: 403 };
  }

  return { actor };
}

export async function requireManageActivitiesActor(
  request: NextRequest,
): Promise<{ actor: AdminUserActor } | { error: string; status: number }> {
  const actor = await getAdminActorFromRequest(request);

  if (!actor) {
    return { error: "Admin authentication required.", status: 401 };
  }

  if (!canManageActivitiesAdmin(actor.role)) {
    return {
      error: "Only Owner or Super Admin can manage activities.",
      status: 403,
    };
  }

  return { actor };
}

export async function requirePlatformSettingsReadActor(
  request: NextRequest,
): Promise<{ actor: AdminUserActor } | { error: string; status: number }> {
  const actor = await getAdminActorFromRequest(request);

  if (!actor) {
    return { error: "Admin authentication required.", status: 401 };
  }

  return { actor };
}

export async function requirePlatformSettingsWriteActor(
  request: NextRequest,
): Promise<{ actor: AdminUserActor } | { error: string; status: number }> {
  const actor = await getAdminActorFromRequest(request);

  if (!actor) {
    return { error: "Admin authentication required.", status: 401 };
  }

  if (actor.role !== "owner" && actor.role !== "super_admin") {
    return {
      error: "Only Owner or Super Admin can change platform settings.",
      status: 403,
    };
  }

  return { actor };
}

export type { AdminRole };
