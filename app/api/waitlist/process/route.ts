import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/stripe/server";
import {
  expireStaleInvitations,
  inviteNextWaitlistEntry,
  processWaitlistOnSpaceAvailable,
} from "@/lib/waitlist/queue";
import type { ClubSession } from "@/lib/sessions";

type ProcessBody = {
  session: ClubSession;
  reason?: "cancellation" | "timer_check";
};

export async function POST(request: Request) {
  let body: ProcessBody;
  try {
    body = (await request.json()) as ProcessBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.session?.id) {
    return NextResponse.json({ error: "Session is required." }, { status: 400 });
  }

  const baseUrl = getAppBaseUrl(request);
  const expired = expireStaleInvitations(body.session.id);
  const invite =
    body.reason === "cancellation"
      ? processWaitlistOnSpaceAvailable(body.session, baseUrl)
      : inviteNextWaitlistEntry(body.session, baseUrl);

  return NextResponse.json({
    expiredCount: expired.length,
    expiredIds: expired.map((entry) => entry.id),
    invite: invite
      ? {
          entryId: invite.entry.id,
          email: invite.entry.email,
          bookingLink: invite.bookingLink,
          emailSent: invite.emailSent,
        }
      : null,
  });
}
