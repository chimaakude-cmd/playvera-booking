import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import {
  appendStripePlatformLog,
  recordStripeWebhookReceived,
} from "@/lib/stripe/platform-admin";

type SimulateBody = {
  event?: string;
  sessionId?: string;
};

export async function POST(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as SimulateBody;
  const event = body.event ?? "checkout.session.completed";
  const sessionId = body.sessionId ?? `cs_sim_${randomUUID().replace(/-/g, "")}`;

  const result = {
    received: true,
    type: event,
    sessionId,
    simulated: true,
    pendingBookingConfirmed: event === "checkout.session.completed",
  };

  await recordStripeWebhookReceived();

  await appendStripePlatformLog({
    eventType: "webhook_simulated",
    message: `Simulated Stripe webhook: ${event}`,
    metadata: {
      adminId: auth.actor.adminId,
      event,
      sessionId,
      result,
    },
  });

  return NextResponse.json({
    ok: true,
    event,
    result,
    message: "Webhook simulation processed.",
  });
}
