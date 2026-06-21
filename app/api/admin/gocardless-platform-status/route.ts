import { NextResponse } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import { getGoCardlessConnectBaseUrl } from "@/lib/gocardless/env";
import {
  getEnvOverrideFlags,
  getServerGoCardlessPlatformConfig,
  isPlatformConnectionVerified,
  payloadToPublic,
  resolveGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";
import { getGoCardlessEnvFromProcessEnv } from "@/lib/gocardless/env";

export type AdminGoCardlessPlatformStatus = {
  environment: "sandbox" | "live";
  platformConfigured: boolean;
  platformEnabled: boolean;
  billingConfigured: boolean;
  clubConnectAvailable: boolean;
  platformFeePercent: number;
  connectionStatus: string;
  connectionStatusLabel: string;
  credentials: {
    clientId: "set" | "missing";
    clientSecret: "set" | "missing";
    redirectUri: "set" | "missing";
    accessToken: "set" | "missing";
    webhookSecret: "set" | "missing";
  };
  callbackUrl: string;
  webhookUrl: string;
  connectBaseUrl: string;
  connectionTest: {
    status: "ready" | "not_configured" | "partial" | "disabled";
    message: string;
  };
};

export async function GET(request: Request) {
  const [resolved, payload] = await Promise.all([
    resolveGoCardlessPlatformConfig(request),
    getServerGoCardlessPlatformConfig(),
  ]);
  const envOverrides = getEnvOverrideFlags(getGoCardlessEnvFromProcessEnv());
  const publicConfig = payloadToPublic(payload, envOverrides);
  const baseUrl = resolveServerAppBaseUrl(request);
  const defaultCallback = `${baseUrl}/api/gocardless/connect/callback`;

  let connectionTest: AdminGoCardlessPlatformStatus["connectionTest"];

  if (!resolved.platformEnabled) {
    connectionTest = {
      status: "disabled",
      message: "Platform is disabled — enable in GoCardless setup to allow club connections.",
    };
  } else if (
    resolved.isClubConnectAvailable &&
    resolved.isBillingConfigured &&
    isPlatformConnectionVerified(resolved.connectionStatus, resolved.environment)
  ) {
    connectionTest = {
      status: "ready",
      message: "Platform ready — clubs can connect and payments can be processed.",
    };
  } else if (
    resolved.platformEnabled &&
    resolved.clientId &&
    resolved.clientSecret &&
    resolved.redirectUri &&
    resolved.accessToken &&
    !isPlatformConnectionVerified(resolved.connectionStatus, resolved.environment)
  ) {
    connectionTest = {
      status: "partial",
      message: "Credentials saved — run Test connection before clubs can connect.",
    };
  } else if (resolved.clientId || resolved.accessToken) {
    connectionTest = {
      status: "partial",
      message: "Incomplete configuration — set OAuth credentials, access token, and enable platform.",
    };
  } else {
    connectionTest = {
      status: "not_configured",
      message: "GoCardless platform is not configured.",
    };
  }

  const response: AdminGoCardlessPlatformStatus = {
    environment: resolved.environment,
    platformConfigured: resolved.isPlatformConfigured,
    platformEnabled: resolved.platformEnabled,
    billingConfigured: resolved.isBillingConfigured,
    clubConnectAvailable: resolved.isClubConnectAvailable,
    platformFeePercent: resolved.platformFeePercent,
    connectionStatus: publicConfig.connectionStatus,
    connectionStatusLabel: publicConfig.connectionStatusLabel,
    credentials: {
      clientId: resolved.clientId ? "set" : "missing",
      clientSecret: resolved.clientSecret ? "set" : "missing",
      redirectUri: resolved.redirectUri ? "set" : "missing",
      accessToken: resolved.accessToken ? "set" : "missing",
      webhookSecret: resolved.webhookSecret ? "set" : "missing",
    },
    callbackUrl: resolved.callbackUri ?? defaultCallback,
    webhookUrl: `${baseUrl}/api/webhooks/gocardless`,
    connectBaseUrl: getGoCardlessConnectBaseUrl(resolved.environment),
    connectionTest,
  };

  return NextResponse.json(response);
}
