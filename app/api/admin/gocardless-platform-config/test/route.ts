import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import { testGoCardlessAccessToken } from "@/lib/gocardless/oauth-core";
import {
  appendGoCardlessPlatformLog,
  GoCardlessPlatformConfigStoreError,
  resolveGoCardlessPlatformConfig,
  setGoCardlessConnectionStatus,
} from "@/lib/gocardless/platform-config";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const resolved = await resolveGoCardlessPlatformConfig(request);

    if (!resolved.accessToken?.trim()) {
      await setGoCardlessConnectionStatus({
        status: "not_configured",
        lastError: "GoCardless access token is required.",
        updatedBy: auth.actor.adminId,
      });

      return NextResponse.json(
        { ok: false, message: "GoCardless access token is required." },
        { status: 400 },
      );
    }

    const result = await testGoCardlessAccessToken(
      resolved.accessToken,
      resolved.environment,
    );

    const connectionStatus = result.ok
      ? resolved.environment === "live"
        ? "live_connected"
        : "sandbox_connected"
      : "error";

    await setGoCardlessConnectionStatus({
      status: connectionStatus,
      lastError: result.ok ? null : result.message,
      updatedBy: auth.actor.adminId,
    });

    const updatedResolved = await resolveGoCardlessPlatformConfig(request);

    await appendGoCardlessPlatformLog({
      level: result.ok ? "info" : "error",
      eventType: "connection_test",
      message: result.message,
      metadata: {
        adminId: auth.actor.adminId,
        environment: resolved.environment,
        creditorId: result.creditorId ?? null,
      },
    });

    return NextResponse.json({
      ok: result.ok,
      message: result.ok
        ? updatedResolved.isClubConnectAvailable
          ? "Connection successful — club connect is available."
          : `Connection successful — billing API verified. Club connect still blocked: ${updatedResolved.clubConnectBlockers.join(" ")}`
        : `Connection failed: ${result.message}`,
      connectionStatus,
      creditorId: result.creditorId ?? null,
      isClubConnectAvailable: updatedResolved.isClubConnectAvailable,
      clubConnectBlockers: updatedResolved.clubConnectBlockers,
      isOAuthConfigured: updatedResolved.isOAuthConfigured,
    });
  } catch (error) {
    if (error instanceof GoCardlessPlatformConfigStoreError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message =
      error instanceof Error ? error.message : "Connection test failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
