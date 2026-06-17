import { buildEmailLogoHeaderHtml } from "@/lib/branding/email-header";
import { deliverEmail } from "@/lib/email/delivery";
import {
  getActivityRemovalReasonLabel,
  type ActivityRemovalReason,
} from "@/lib/admin/activities-data";

export type ActivityRemovalEmailParams = {
  providerEmail: string;
  providerName: string;
  activityTitle: string;
  removalReason: ActivityRemovalReason;
  removalNotes?: string | null;
};

export function buildActivityRemovalSubject(): string {
  return "Your activity listing has been removed";
}

export function buildActivityRemovalPlainBody(
  params: ActivityRemovalEmailParams,
): string {
  const reasonLabel = getActivityRemovalReasonLabel(params.removalReason);
  const notes = params.removalNotes?.trim();

  const lines = [
    `Hi ${params.providerName},`,
    "",
    `Your activity listing "${params.activityTitle}" has been removed from Activora.`,
    "",
    `Reason: ${reasonLabel}`,
  ];

  if (notes) {
    lines.push("", "Admin note:", notes);
  }

  lines.push(
    "",
    "If you believe this was a mistake, please contact Activora support.",
    "",
    "Kind regards,",
    "Activora Team",
  );

  return lines.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildActivityRemovalHtmlBody(
  params: ActivityRemovalEmailParams,
): string {
  const plain = buildActivityRemovalPlainBody(params);
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

export async function sendActivityRemovalEmail(
  params: ActivityRemovalEmailParams,
): Promise<
  | { ok: true; sent: true }
  | { ok: true; sent: false; notice: string }
  | { ok: false; error: string }
> {
  const subject = buildActivityRemovalSubject();
  const text = buildActivityRemovalPlainBody(params);
  const html = buildActivityRemovalHtmlBody(params);

  const result = await deliverEmail({
    to: params.providerEmail,
    subject,
    html,
    text,
  });

  if (!result.ok) {
    console.error(
      "[Admin activities] Provider removal email failed:",
      params.providerEmail,
      result.error,
    );
    return { ok: false, error: result.error };
  }

  if (!result.sent) {
    return { ok: true, sent: false, notice: result.notice };
  }

  return { ok: true, sent: true };
}
