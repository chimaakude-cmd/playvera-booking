import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { getGoCardlessEnv } from "@/lib/gocardless/env";

type OnboardBody = {
  providerId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as OnboardBody;
  const providerId = body.providerId ?? "demo-provider-1";
  const env = getGoCardlessEnv();

  const baseUrl = getAppBaseUrl(request);

  const returnUrl = `${baseUrl}/club/finance?tab=payment-providers&gocardless=connected`;

  if (env.isConfigured) {
    // Stub: real OAuth redirect URL would be returned here
    return NextResponse.json({
      url: returnUrl,
      providerId,
      mock: false,
      message: "GoCardless OAuth stub — implement partner connect flow.",
    });
  }

  return NextResponse.json({
    url: returnUrl,
    providerId,
    mock: true,
    message: "Mock GoCardless connect — no API token configured.",
  });
}
