import { NextResponse } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
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

export async function GET(request: Request) {
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
}
