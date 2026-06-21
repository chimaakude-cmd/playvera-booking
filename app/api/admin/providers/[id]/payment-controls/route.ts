import { NextRequest, NextResponse } from "next/server";
import {
  requirePlatformSettingsReadActor,
  requirePlatformSettingsWriteActor,
} from "@/lib/admin-users/api-auth";
import {
  fetchProviderPaymentAuditLog,
  fetchProviderPaymentControls,
  updateProviderPaymentControls,
  type ProviderPaymentControlsUpdate,
} from "@/lib/admin/provider-payment-controls";
import type { PayoutSchedule } from "@/lib/payments/club-payment-status";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const controls = await fetchProviderPaymentControls(id);

  if (!controls) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }

  const auditLog = await fetchProviderPaymentAuditLog(id);

  return NextResponse.json({ controls, auditLog });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: ProviderPaymentControlsUpdate;
  try {
    body = (await request.json()) as ProviderPaymentControlsUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    body.platformFeeOverridePercent !== undefined &&
    body.platformFeeOverridePercent !== null &&
    (body.platformFeeOverridePercent < 0 || body.platformFeeOverridePercent > 10)
  ) {
    return NextResponse.json(
      { error: "Platform fee override must be between 0 and 10%." },
      { status: 400 },
    );
  }

  if (
    body.payoutSchedule &&
    !["daily", "weekly", "monthly"].includes(body.payoutSchedule)
  ) {
    return NextResponse.json(
      { error: "Invalid payout schedule." },
      { status: 400 },
    );
  }

  const result = await updateProviderPaymentControls(
    id,
    {
      ...body,
      payoutSchedule: body.payoutSchedule as PayoutSchedule | undefined,
    },
    auth.actor.adminId,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const controls = await fetchProviderPaymentControls(id);
  const auditLog = await fetchProviderPaymentAuditLog(id);

  return NextResponse.json({ controls, auditLog });
}
