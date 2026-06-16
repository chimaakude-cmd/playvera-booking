import { NextResponse } from "next/server";
import { getServerWaitlistEntryByToken } from "@/lib/waitlist/server-store";
import { expireStaleInvitations } from "@/lib/waitlist/queue";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const entry = getServerWaitlistEntryByToken(token);

  if (!entry) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  expireStaleInvitations(entry.sessionId);

  const refreshed = getServerWaitlistEntryByToken(token);
  if (!refreshed) {
    return NextResponse.json({ error: "Invitation expired." }, { status: 410 });
  }

  return NextResponse.json({ entry: refreshed });
}
