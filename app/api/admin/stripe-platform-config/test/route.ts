import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import { resolveStripeMode } from "@/lib/stripe/env";
import {
  appendStripePlatformLog,
  resolveStripePlatformConfig,
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
      });

      return NextResponse.json(
        { ok: false, message: "Stripe API keys are required." },
        { status: 400 },
      );
    }

    const probe = await probeStripeConnectEnabled();
    const mode = resolveStripeMode();

    const connectionStatus = !probe.secretKeyValid
      ? "not_configured"
      : probe.connectEnabled && mode === "live"
        ? "live_connected"
        : probe.connectEnabled && mode === "test"
          ? "test_connected"
          : probe.platformMisconfigured
            ? "error"
            : "error";

    await setStripeConnectionStatus({
      status: connectionStatus,
      lastError: probe.connectEnabled ? null : probe.message,
    });

    const updatedResolved = await resolveStripePlatformConfig(request);

    await appendStripePlatformLog({
      level: probe.connectEnabled ? "info" : "error",
      eventType: "connection_test",
      message: probe.message,
      metadata: {
        adminId: auth.actor.adminId,
        environment: mode,
        connectEnabled: probe.connectEnabled,
        platformMisconfigured: probe.platformMisconfigured,
      },
    });

    return NextResponse.json({
      ok: probe.connectEnabled,
      message: probe.connectEnabled
        ? updatedResolved.isClubConnectAvailable
          ? "Connection successful — club connect is available."
          : `Connection successful — Stripe API verified. Club connect still blocked: ${updatedResolved.clubConnectBlockers.join(" ")}`
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
