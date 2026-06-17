export type LoggedEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  loggedAt: string;
};

const loggedEmails: LoggedEmail[] = [];

export function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || process.env.RESEND_FROM?.trim();

  return Boolean(apiKey && from);
}

export function getLoggedEmails(): LoggedEmail[] {
  return [...loggedEmails];
}

export type DeliverEmailResult =
  | { ok: true; sent: true }
  | { ok: true; sent: false; logged: true; notice: string }
  | { ok: false; error: string };

export async function deliverEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<DeliverEmailResult> {
  if (!isEmailConfigured()) {
    const record: LoggedEmail = {
      ...params,
      loggedAt: new Date().toISOString(),
    };
    loggedEmails.push(record);
    console.info(
      "[Activora] Email logged (not sent - configure email provider):",
      { to: record.to, subject: record.subject, loggedAt: record.loggedAt },
    );
    return {
      ok: true,
      sent: false,
      logged: true,
      notice: "Email logged (not sent - configure email provider)",
    };
  }

  const from =
    process.env.EMAIL_FROM?.trim() || process.env.RESEND_FROM?.trim()!;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[Activora] Failed to send email:",
        response.status,
        errorBody,
      );
      return {
        ok: false,
        error: "Failed to send provider notification email.",
      };
    }

    return { ok: true, sent: true };
  } catch (error) {
    console.error("[Activora] Failed to send email:", error);
    return {
      ok: false,
      error: "Failed to send provider notification email.",
    };
  }
}
