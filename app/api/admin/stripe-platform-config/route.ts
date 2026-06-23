import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsReadActor } from "@/lib/admin-users/api-auth";
import {
  resolveStripePlatformConfig,
  StripePlatformAdminStoreError,
} from "@/lib/stripe/platform-admin";

function storeErrorResponse(error: unknown, fallback: string) {
  if (error instanceof StripePlatformAdminStoreError) {
    const status =
      error.code === "not_configured" || error.code === "migration_required"
        ? 503
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error("[Stripe platform config] API error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const resolved = await resolveStripePlatformConfig(request);

    return NextResponse.json({
      config: resolved.public,
      resolved: {
        isClubConnectAvailable: resolved.isClubConnectAvailable,
        isPlatformConfigured: resolved.isPlatformConfigured,
        isConnectionVerified: resolved.isConnectionVerified,
        isWebhookConfigured: resolved.isWebhookConfigured,
        clubConnectBlockers: resolved.clubConnectBlockers,
        webhookUri: resolved.webhookUri,
        environment: resolved.environment,
        environmentLabel: resolved.environmentLabel,
      },
    });
  } catch (error) {
    return storeErrorResponse(error, "Failed to load Stripe platform config.");
  }
}
