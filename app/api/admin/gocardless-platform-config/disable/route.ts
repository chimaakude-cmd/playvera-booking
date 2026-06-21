import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import {
  appendGoCardlessPlatformLog,
  updateServerGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = await updateServerGoCardlessPlatformConfig(
    { platformEnabled: false },
    auth.actor.adminId,
  );

  await appendGoCardlessPlatformLog({
    eventType: "platform_disabled",
    message: "GoCardless platform disabled by admin.",
    metadata: { adminId: auth.actor.adminId },
  });

  return NextResponse.json({
    ok: true,
    platformEnabled: payload.platformEnabled,
    message: "GoCardless platform disabled. Clubs can no longer connect.",
  });
}
