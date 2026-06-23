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
  getResolvedStripeEnv,
  resolveStripePlatformConfig,
  appendStripePlatformLog,
  getServerStripePlatformConfig,
  StripePlatformAdminStoreError,
  updateServerStripePlatformConfig,
} from "@/lib/stripe/platform-admin";
import type {
  StripePlatformConfigPayload,
  StripePlatformConfigUpdate,
} from "@/lib/stripe/platform-admin/types";
import {
  resolveStripeModeFromPublishableKey,
  resolveStripeModeFromSecretKey,
  validateStripeKeyModeMatch,
  validateStripePublishableKey,
  validateStripeSecretKey,
  validateStripeWebhookSecret,
} from "@/lib/stripe/env";

function mergePayload(
  existing: StripePlatformConfigPayload,
  body: StripePlatformConfigUpdate,
): StripePlatformConfigPayload {
  return {
    ...existing,
    environment: body.environment ?? existing.environment,
    secretKey:
      body.secretKey !== undefined
        ? body.secretKey?.trim() || null
        : existing.secretKey,
    publishableKey:
      body.publishableKey !== undefined
        ? body.publishableKey?.trim() || null
        : existing.publishableKey,
    webhookSecret:
      body.webhookSecret !== undefined
        ? body.webhookSecret?.trim() || null
        : existing.webhookSecret,
    platformEnabled: body.platformEnabled ?? existing.platformEnabled,
    platformFeePercent: body.platformFeePercent ?? existing.platformFeePercent,
  };
}

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

function assertKeyMatchesEnvironment(
  keyMode: "test" | "live" | null,
  environment: "test" | "live",
  fieldLabel: string,
): string | null {
  if (!keyMode) {
    return null;
  }

  if (environment === "live" && keyMode === "test") {
    return `${fieldLabel} uses test mode keys — not allowed when Environment is Live. Use sk_live_ / pk_live_ keys or switch Environment to Test mode.`;
  }

  if (environment === "test" && keyMode === "live") {
    return `${fieldLabel} uses live mode keys — not allowed when Environment is Test. Use sk_test_ / pk_test_ keys or switch Environment to Live.`;
  }

  return null;
}

async function validateSavePayload(
  body: StripePlatformConfigUpdate,
  existing: StripePlatformConfigPayload,
): Promise<string | null> {
  const merged = mergePayload(existing, body);
  const resolved = await getResolvedStripeEnv(merged);
  const keyMode = resolveStripeModeFromSecretKey(resolved.secretKey);
  const publishableMode = resolveStripeModeFromPublishableKey(
    resolved.publishableKey,
  );

  if (resolved.secretKey) {
    const validation = validateStripeSecretKey(resolved.secretKey);
    if (!validation.valid) {
      return validation.error ?? "Invalid STRIPE_SECRET_KEY.";
    }

    const modeError = assertKeyMatchesEnvironment(
      validation.mode ?? null,
      resolved.environment,
      "STRIPE_SECRET_KEY",
    );
    if (modeError) {
      return modeError;
    }
  }

  if (resolved.publishableKey) {
    const validation = validateStripePublishableKey(resolved.publishableKey);
    if (!validation.valid) {
      return validation.error ?? "Invalid publishable key.";
    }

    const modeError = assertKeyMatchesEnvironment(
      validation.mode ?? null,
      resolved.environment,
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    );
    if (modeError) {
      return modeError;
    }
  }

  if (body.webhookSecret?.trim()) {
    const validation = validateStripeWebhookSecret(body.webhookSecret);
    if (!validation.valid) {
      return validation.error ?? "Invalid STRIPE_WEBHOOK_SECRET.";
    }
  } else if (resolved.webhookSecret) {
    const validation = validateStripeWebhookSecret(resolved.webhookSecret);
    if (!validation.valid) {
      return validation.error ?? "Invalid STRIPE_WEBHOOK_SECRET.";
    }
  }

  const modeMatch = validateStripeKeyModeMatch(
    resolved.secretKey ?? undefined,
    resolved.publishableKey ?? undefined,
  );
  if (!modeMatch.valid && modeMatch.error) {
    return modeMatch.error;
  }

  if (keyMode && keyMode !== resolved.environment) {
    return `Environment is set to ${resolved.environment} but the resolved secret key is ${keyMode} mode. Align Environment with your API keys.`;
  }

  if (publishableMode && publishableMode !== resolved.environment) {
    return `Environment is set to ${resolved.environment} but the resolved publishable key is ${publishableMode} mode. Align Environment with your API keys.`;
  }

  return null;
}

async function buildFullConfigResponse(
  request: NextRequest,
  payload: StripePlatformConfigPayload,
) {
  const resolved = await resolveStripePlatformConfig(request, payload);

  return {
    config: resolved.public,
    resolved: {
      isClubConnectAvailable: resolved.isClubConnectAvailable,
      isPlatformConfigured: resolved.isPlatformConfigured,
      isConnectionVerified: resolved.isConnectionVerified,
      isWebhookConfigured: resolved.isWebhookConfigured,
      clubConnectBlockers: resolved.clubConnectBlockers,
      webhookUri: `${resolveServerAppBaseUrl(request)}/api/stripe/webhook`,
      environment: resolved.environment,
      environmentLabel: resolved.environmentLabel,
      resolvedKeyMode: resolved.resolvedKeyMode,
      resolvedKeyModeLabel: resolved.resolvedKeyModeLabel,
      environmentKeyMismatch: resolved.environmentKeyMismatch,
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const payload = await getServerStripePlatformConfig();
    return NextResponse.json(await buildFullConfigResponse(request, payload));
  } catch (error) {
    return storeErrorResponse(error, "Failed to load Stripe platform config.");
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as StripePlatformConfigUpdate;
    const existing = await getServerStripePlatformConfig();

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

    const validationError = await validateSavePayload(body, existing);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const payload = await updateServerStripePlatformConfig(
      body,
      auth.actor.adminId,
    );

    await appendStripePlatformLog({
      eventType: "config_saved",
      message: "Stripe platform configuration saved.",
      metadata: {
        adminId: auth.actor.adminId,
        platformEnabled: payload.platformEnabled,
        environment: payload.environment,
      },
    });

    return NextResponse.json({
      ...(await buildFullConfigResponse(request, payload)),
      message: "Configuration saved",
    });
  } catch (error) {
    return storeErrorResponse(error, "Unable to save Stripe configuration.");
  }
}
