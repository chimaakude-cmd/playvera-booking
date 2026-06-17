export function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function buildAdminInviteLink(token: string, baseUrl?: string): string {
  const origin =
    baseUrl ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  return `${origin.replace(/\/$/, "")}/admin/accept-invite?token=${encodeURIComponent(token)}`;
}

export { getInviteDeliveryNote, isAdminInviteEmailConfigured } from "./invite-email";

/** @deprecated Use isAdminInviteEmailConfigured() server-side or API meta.emailConfigured */
export const ADMIN_INVITE_EMAIL_CONNECTED = false;
