import type { AdminUserActor } from "./server-store";

const ADMIN_ROLE_HEADER = "x-admin-role";
const ADMIN_EMAIL_HEADER = "x-admin-email";
const ADMIN_ID_HEADER = "x-admin-id";
const ADMIN_NAME_HEADER = "x-admin-name";

export function adminActorHeaders(actor: AdminUserActor): Record<string, string> {
  return {
    [ADMIN_ROLE_HEADER]: actor.role,
    [ADMIN_EMAIL_HEADER]: actor.email,
    [ADMIN_ID_HEADER]: actor.adminId,
    [ADMIN_NAME_HEADER]: actor.name,
  };
}
