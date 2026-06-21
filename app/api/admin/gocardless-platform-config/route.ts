import { NextRequest, NextResponse } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import {
  requirePlatformSettingsReadActor,
  requirePlatformSettingsWriteActor,
} from "@/lib/admin-users/api-auth";
import {
  MAX_PLATFORM_FEE_PERCENT,
  MIN_PLATFORM_FEE_PERCENT,
} from "@/lib/fee-settings";
import {
  appendGoCardlessPlatformLog,
  getEnvOverrideFlags,
  getServerGoCardlessPlatformConfig,
  GoCardlessPlatformConfigStoreError,
  payloadToPublic,
  resolveGoCardlessPlatformConfig,
  updateServerGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";
import { getGoCardlessEnvFromProcessEnv } from "@/lib/gocardless/env";
import type { GoCardlessPlatformConfigUpdate } from "@/lib/gocardless/platform-config/types";

function storeErrorResponse(error: unknown, fallback: string) {
  if (error instanceof GoCardlessPlatformConfigStoreError) {
    const status = error.code === "not_configured" ? 503 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error("[GoCardless platform config] API error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [payload, resolved] = await Promise.all([
      getServerGoCardlessPlatformConfig(),
      resolveGoCardlessPlatformConfig(request),
    ]);
    const envOverrides = getEnvOverrideFlags(getGoCardlessEnvFromProcessEnv());
    const baseUrl = resolveServerAppBaseUrl(request);

    return NextResponse.json({
      config: payloadToPublic(payload, envOverrides),
      resolved: {
        isClubConnectAvailable: resolved.isClubConnectAvailable,
        isBillingConfigured: resolved.isBillingConfigured,
        callbackUri: resolved.callbackUri,
        webhookUri: `${baseUrl}/api/webhooks/gocardless`,
      },
    });
  } catch (error) {
    return storeErrorResponse(error, "Failed to load GoCardless platform config.");
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as GoCardlessPlatformConfigUpdate;

    if (
      body.platformFeePercent !== undefined &&
      (body.platformFeePercent < MIN_PLATFORM_FEE_PERCENT ||
        body.platformFeePercent > MAX_PLATFORM_FEE_PERCENT)
    ) {
      return NextResponse.json(
        {
          error: `Platform fee must be between ${MIN_PLATFORM_FEE_PERCENT}% and ${MAX_PLATFORM_FEE_PERCENT}%.`,
        },
        { status: 400 },
      );
    }

    const payload = await updateServerGoCardlessPlatformConfig(
      body,
      auth.actor.adminId,
    );

    await appendGoCardlessPlatformLog({
      eventType: "config_saved",
      message: "GoCardless platform configuration saved.",
      metadata: {
        adminId: auth.actor.adminId,
        platformEnabled: payload.platformEnabled,
        environment: payload.environment,
      },
    });

    const envOverrides = getEnvOverrideFlags(getGoCardlessEnvFromProcessEnv());

    return NextResponse.json({
      config: payloadToPublic(payload, envOverrides),
    });
  } catch (error) {
    return storeErrorResponse(error, "Unable to save GoCardless configuration.");
  }
}
