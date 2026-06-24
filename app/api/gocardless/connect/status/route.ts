import { NextResponse } from "next/server";
import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { getProviderGoCardlessState } from "@/lib/gocardless/provider-persistence";
import {
  isGoCardlessConnected,
  type GoCardlessConnectionStatus,
} from "@/lib/gocardless/types";
import { resolveGoCardlessPlatformConfig } from "@/lib/gocardless/platform-config";

const PLATFORM_UNAVAILABLE_MESSAGE =
  "GoCardless unavailable. Activora is still configuring Direct Debit.";

function resolveConnectionStatus(
  row: {
    gocardless_status: string;
    gocardless_merchant_id: string | null;
  } | null,
): GoCardlessConnectionStatus {
  if (!row) {
    return "not_connected";
  }

  const status = row.gocardless_status as GoCardlessConnectionStatus;
  if (
    status === "connected" &&
    !isGoCardlessConnected(status, row.gocardless_merchant_id)
  ) {
    return "not_connected";
  }

  return status;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId")?.trim() || "demo-provider-1";
    const resolved = await resolveGoCardlessPlatformConfig(request);
    const row = await getProviderGoCardlessState(providerId);
    const status = resolveConnectionStatus(row);

    return NextResponse.json({
      providerId,
      platformConfigured: resolved.isClubConnectAvailable,
      platformEnabled: resolved.platformEnabled,
      environment: resolved.environment,
      status,
      merchantId: row?.gocardless_merchant_id ?? null,
      organisationId: row?.gocardless_organisation_id ?? null,
      connectedAt: row?.gocardless_connected_at ?? null,
      platformFeePercent: resolved.platformFeePercent,
      configured: resolved.isClubConnectAvailable,
      mock: false,
      message: resolved.isClubConnectAvailable
        ? "GoCardless platform is configured."
        : PLATFORM_UNAVAILABLE_MESSAGE,
    });
  } catch (error) {
    console.error("[gocardless/connect/status] GET failed:", error);
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId")?.trim() || "demo-provider-1";

    return NextResponse.json({
      providerId,
      platformConfigured: false,
      platformEnabled: false,
      environment: "sandbox",
      status: "not_connected" as GoCardlessConnectionStatus,
      merchantId: null,
      organisationId: null,
      connectedAt: null,
      platformFeePercent: 0,
      configured: false,
      mock: false,
      message: PLATFORM_UNAVAILABLE_MESSAGE,
    });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { providerId?: string };
  const providerId = body.providerId?.trim() || "demo-provider-1";
  const resolved = await resolveGoCardlessPlatformConfig(request);

  if (!resolved.isClubConnectAvailable) {
    if (isDevelopmentEnvironment()) {
      return NextResponse.json({
        ok: false,
        message: PLATFORM_UNAVAILABLE_MESSAGE,
        status: "not_connected" as GoCardlessConnectionStatus,
        providerId,
        mock: true,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: PLATFORM_UNAVAILABLE_MESSAGE,
        status: "not_connected" as GoCardlessConnectionStatus,
        providerId,
        mock: false,
      },
      { status: 503 },
    );
  }

  const row = await getProviderGoCardlessState(providerId);
  const status = resolveConnectionStatus(row);
  const connected = isGoCardlessConnected(status, row?.gocardless_merchant_id);

  return NextResponse.json({
    ok: connected,
    message: connected
      ? "GoCardless connection verified."
      : "GoCardless is not connected.",
    status,
    providerId,
    merchantId: row?.gocardless_merchant_id ?? null,
    mock: false,
  });
}
