import { buildEmailLogoHeaderHtml } from "@/lib/branding/email-header";

export type WaitlistInviteEmailParams = {
  parentName: string;
  childName: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  clubName: string;
  bookingLink: string;
  expiresAt: string;
};

export function buildWaitlistInviteSubject(): string {
  return "A space has opened for your booking";
}

export function buildWaitlistInvitePlainBody(
  params: WaitlistInviteEmailParams,
): string {
  return [
    `Hi ${params.parentName},`,
    "",
    "Complete payment to secure your place.",
    "",
    `A space has opened for ${params.childName} on ${params.sessionTitle}.`,
    `${params.sessionDate} at ${params.sessionTime}`,
    "",
    `Complete your booking within 15 minutes: ${params.bookingLink}`,
    "",
    `This invitation expires at ${new Date(params.expiresAt).toLocaleString("en-GB")}.`,
    "",
    `— ${params.clubName}`,
  ].join("\n");
}

export function buildWaitlistInviteHtmlBody(
  params: WaitlistInviteEmailParams,
): string {
  const plain = buildWaitlistInvitePlainBody(params);
  const bodyHtml = plain
    .split("\n")
    .map((line) => {
      if (!line) {
        return "";
      }
      if (line.startsWith("Complete your booking")) {
        const url = params.bookingLink;
        return `<p style="margin:0 0 12px 0;"><a href="${url}" style="color:#2563EB;font-weight:600;">Complete payment to secure your place</a></p>`;
      }
      return `<p style="margin:0 0 12px 0;">${line}</p>`;
    })
    .join("");

  return `${buildEmailLogoHeaderHtml()}<div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;max-width:560px;margin:0 auto;">${bodyHtml}</div>`;
}

export type SentWaitlistEmail = {
  to: string;
  subject: string;
  plainBody: string;
  htmlBody: string;
  sentAt: string;
};

const sentEmails: SentWaitlistEmail[] = [];

export function logWaitlistInviteEmail(
  to: string,
  params: WaitlistInviteEmailParams,
): SentWaitlistEmail {
  const record: SentWaitlistEmail = {
    to,
    subject: buildWaitlistInviteSubject(),
    plainBody: buildWaitlistInvitePlainBody(params),
    htmlBody: buildWaitlistInviteHtmlBody(params),
    sentAt: new Date().toISOString(),
  };
  sentEmails.push(record);
  return record;
}

export function getSentWaitlistEmails(): SentWaitlistEmail[] {
  return [...sentEmails];
}
