import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import { handleGoCardlessBookingWebhookEvent } from "@/lib/gocardless/webhook-handlers";
import { appendGoCardlessPlatformLog } from "@/lib/gocardless/platform-config";

type SimulateBody = {
  event?: string;
  paymentId?: string;
  mandateId?: string;
};

export async function POST(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as SimulateBody;
  const event = body.event ?? "payment_confirmed";
  const paymentId = body.paymentId ?? `SIM_PM_${randomUUID()}`;
  const mandateId = body.mandateId ?? `SIM_MD_${randomUUID()}`;

  const result = await handleGoCardlessBookingWebhookEvent({
    resourceType:
      event.startsWith("mandate") ? "mandates" : "payments",
    action: event.includes("_")
      ? event.split("_").slice(1).join("_")
      : event.replace(/^(payment|mandate)_/, ""),
    links: {
      payment: paymentId,
      mandate: mandateId,
    },
    simulated: true,
  });

  await appendGoCardlessPlatformLog({
    eventType: "webhook_simulated",
    message: `Simulated GoCardless webhook: ${event}`,
    metadata: {
      adminId: auth.actor.adminId,
      event,
      paymentId,
      mandateId,
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
