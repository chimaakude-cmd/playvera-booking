import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  appendStripePlatformLog,
  getResolvedStripeCredentials,
  resolveStripePlatformConfig,
  resolveStripeConnectionStatusFromProbe,
  setStripeConnectionStatus,
  StripePlatformAdminStoreError,
} from "@/lib/stripe/platform-admin";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const resolved = await resolveStripePlatformConfig(request);

    if (!resolved.isPlatformConfigured) {
      await setStripeConnectionStatus({
        status: "not_configured",
        lastError: "Stripe API keys are required.",
        updatedBy: auth.actor.adminId,
      });

      return NextResponse.json(
        { ok: false, message: "Stripe API keys are required." },
        { status: 400 },
      );
    }

    const credentials = await getResolvedStripeCredentials();
    const probe = await probeStripeConnectEnabled(credentials.secretKey);
    const keyMode = credentials.keyMode;

    if (credentials.environmentKeyMismatch && keyMode) {
      const mismatchMessage = `Environment is set to ${credentials.environment} but the resolved secret key is ${keyMode} mode. Align Environment with your API keys before testing connection.`;

      await setStripeConnectionStatus({
        status: "error",
        lastError: mismatchMessage,
        updatedBy: auth.actor.adminId,
      });

      return NextResponse.json(
        {
          ok: false,
          message: mismatchMessage,
          connectionStatus: "error",
        },
        { status: 400 },
      );
    }

    const connectionStatus = resolveStripeConnectionStatusFromProbe({
      secretKeyValid: probe.secretKeyValid,
      connectEnabled: probe.connectEnabled,
      mode: keyMode,
      existingStatus: resolved.connectionStatus,
    });

    await setStripeConnectionStatus({
      status: connectionStatus,
      lastError: probe.connectEnabled ? null : probe.message,
      updatedBy: auth.actor.adminId,
    });

    const updatedResolved = await resolveStripePlatformConfig(request);

    await appendStripePlatformLog({
      level: probe.connectEnabled ? "info" : "error",
      eventType: "connection_test",
      message: probe.message,
      metadata: {
        adminId: auth.actor.adminId,
        keyMode,
        environment: credentials.environment,
        connectionStatus,
        connectEnabled: probe.connectEnabled,
        platformMisconfigured: probe.platformMisconfigured,
      },
    });

    return NextResponse.json({
      ok: probe.connectEnabled,
      message: probe.connectEnabled
        ? updatedResolved.isClubConnectAvailable
          ? "Connection successful — club connect is available."
          : `Connection successful — Stripe API verified (${connectionStatus === "live_connected" ? "live" : "test"} mode). Club connect still blocked: ${updatedResolved.clubConnectBlockers.join(" ")}`
        : `Connection failed: ${probe.message}`,
      connectionStatus,
      isClubConnectAvailable: updatedResolved.isClubConnectAvailable,
      clubConnectBlockers: updatedResolved.clubConnectBlockers,
    });
  } catch (error) {
    if (error instanceof StripePlatformAdminStoreError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message =
      error instanceof Error ? error.message : "Connection test failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
