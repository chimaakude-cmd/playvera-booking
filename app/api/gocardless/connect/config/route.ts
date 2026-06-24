import { NextResponse } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import {
  DEFAULT_GOCARDLESS_PLATFORM_CONFIG,
} from "@/lib/gocardless/platform-config/defaults";
import {
  resolveGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";

export type GoCardlessConnectConfigResponse = {
  platformConfigured: boolean;
  platformUnavailable: boolean;
  platformEnabled: boolean;
  environment: "sandbox" | "live";
  redirectUri: string | null;
  callbackUrl: string;
  billingConfigured: boolean;
  platformFeePercent: number;
};

function buildUnavailableConfigResponse(
  request: Request,
): GoCardlessConnectConfigResponse {
  const baseUrl = resolveServerAppBaseUrl(request);
  return {
    platformConfigured: false,
    platformUnavailable: true,
    platformEnabled: DEFAULT_GOCARDLESS_PLATFORM_CONFIG.platformEnabled,
    environment: DEFAULT_GOCARDLESS_PLATFORM_CONFIG.environment,
    redirectUri: null,
    callbackUrl: `${baseUrl}/api/gocardless/connect/callback`,
    billingConfigured: false,
    platformFeePercent: DEFAULT_GOCARDLESS_PLATFORM_CONFIG.platformFeePercent,
  };
}

export async function GET(request: Request) {
  try {
    const resolved = await resolveGoCardlessPlatformConfig(request);

    const baseUrl = resolveServerAppBaseUrl(request);
    const defaultCallback = `${baseUrl}/api/gocardless/connect/callback`;

    const response: GoCardlessConnectConfigResponse = {
      platformConfigured: resolved.isClubConnectAvailable,
      platformUnavailable: !resolved.isClubConnectAvailable,
      platformEnabled: resolved.platformEnabled,
      environment: resolved.environment,
      redirectUri: resolved.redirectUri,
      callbackUrl: resolved.callbackUri ?? defaultCallback,
      billingConfigured: resolved.isBillingConfigured,
      platformFeePercent: resolved.platformFeePercent,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[gocardless/connect/config] Platform config unavailable:", error);
    return NextResponse.json(buildUnavailableConfigResponse(request));
  }
}
