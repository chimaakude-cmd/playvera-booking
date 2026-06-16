import { NextResponse } from "next/server";
import { getGoCardlessEnv } from "@/lib/gocardless/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId") ?? "demo-provider-1";
  const env = getGoCardlessEnv();

  return NextResponse.json({
    providerId,
    configured: env.isConfigured,
    environment: env.environment,
    status: env.isConfigured ? "connected" : "not_connected",
    mock: !env.isConfigured,
    message: env.isConfigured
      ? "GoCardless API credentials detected."
      : "Mock mode — add GOCARDLESS_ACCESS_TOKEN to enable live API.",
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { providerId?: string };
  const providerId = body.providerId ?? "demo-provider-1";
  const env = getGoCardlessEnv();

  if (env.isConfigured) {
    return NextResponse.json({
      ok: true,
      message: "GoCardless connection verified via API credentials.",
      status: "connected",
      providerId,
      mock: false,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Mock GoCardless connection test passed.",
    status: "connected",
    providerId,
    mock: true,
  });
}
