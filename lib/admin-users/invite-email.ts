import { buildEmailLogoHeaderHtml } from "@/lib/branding/email-header";
import { deliverEmail, isEmailConfigured } from "@/lib/email/delivery";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/permissions";
import type { AdminUserRole } from "./types";

export function isAdminInviteEmailConfigured(): boolean {
  return (
    isEmailConfigured() ||
    Boolean(process.env.ADMIN_INVITE_EMAIL_PROVIDER?.trim())
  );
}

export function getInviteDeliveryNote(emailConfigured = isAdminInviteEmailConfigured()): string {
  if (emailConfigured) {
    return "An invite email will be sent automatically when you click Send invite.";
  }

  return "Email is not configured — click Send invite, then copy the link and share it with the recipient.";
}

export type AdminInviteEmailParams = {
  to: string;
  name: string;
  role: AdminUserRole;
  inviteLink: string;
};

export function buildAdminInviteSubject(): string {
  return "You have been invited to Activora admin";
}

export function buildAdminInvitePlainBody(params: AdminInviteEmailParams): string {
  const roleLabel = ADMIN_ROLE_LABELS[params.role];

  return [
    `Hi ${params.name},`,
    "",
    "You have been invited to join the Activora platform admin team.",
    "",
    `Role: ${roleLabel}`,
    "",
    "Accept your invite and set your password using this secure link:",
    params.inviteLink,
    "",
    "This link expires in 7 days.",
    "",
    "If you did not expect this invite, you can ignore this email.",
    "",
    "Kind regards,",
    "Activora Team",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAdminInviteHtmlBody(params: AdminInviteEmailParams): string {
  const plain = buildAdminInvitePlainBody(params);
  const bodyHtml = plain
    .split("\n")
    .map((line) =>
      line
        ? `<p style="margin:0 0 12px 0;">${escapeHtml(line)}</p>`
        : "",
    )
    .join("");

  return `${buildEmailLogoHeaderHtml()}<div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;max-width:560px;margin:0 auto;">${bodyHtml}</div>`;
}

export async function sendAdminInviteEmail(
  params: AdminInviteEmailParams,
): Promise<
  | { ok: true; sent: true }
  | { ok: true; sent: false; notice: string }
  | { ok: false; error: string }
> {
  if (!isAdminInviteEmailConfigured()) {
    return {
      ok: true,
      sent: false,
      notice: "Email not configured — share the invite link manually.",
    };
  }

  const result = await deliverEmail({
    to: params.to,
    subject: buildAdminInviteSubject(),
    text: buildAdminInvitePlainBody(params),
    html: buildAdminInviteHtmlBody(params),
  });

  if (!result.ok) {
    console.error(
      "[Admin users] Invite email failed:",
      params.to,
      result.error,
    );
    return { ok: false, error: result.error };
  }

  if (!result.sent) {
    return { ok: true, sent: false, notice: result.notice };
  }

  return { ok: true, sent: true };
}
