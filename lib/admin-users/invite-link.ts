import { BRAND_NAME } from "@/lib/brand";

export function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function buildAdminInviteLink(token: string, baseUrl?: string): string {
  const origin =
    baseUrl ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  return `${origin.replace(/\/$/, "")}/staff-access/invite?token=${encodeURIComponent(token)}`;
}

export const ADMIN_INVITE_EMAIL_CONNECTED = Boolean(
  process.env.ADMIN_INVITE_EMAIL_PROVIDER,
);

export function getInviteDeliveryNote(): string {
  if (ADMIN_INVITE_EMAIL_CONNECTED) {
    return "An invite email will be sent automatically.";
  }

  return `Email is not connected — copy the invite link and share it with the recipient via ${BRAND_NAME} internal channels.`;
}
