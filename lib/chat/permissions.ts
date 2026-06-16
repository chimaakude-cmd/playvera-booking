import type { AdminRole } from "@/lib/admin/types";
import { roleHasPermission } from "@/lib/admin/permissions";
import type { ConversationType } from "./types";

export function canAccessMessagesInbox(role: AdminRole): boolean {
  return roleHasPermission(role, "manage_messages");
}

export function canViewConversationType(
  role: AdminRole,
  type: ConversationType,
): boolean {
  if (!canAccessMessagesInbox(role)) {
    return false;
  }
  return true;
}

export function canReplyToConversation(role: AdminRole): boolean {
  return roleHasPermission(role, "manage_messages");
}

export function canAssignConversation(role: AdminRole): boolean {
  return roleHasPermission(role, "manage_messages");
}
