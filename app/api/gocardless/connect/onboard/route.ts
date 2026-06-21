import { NextResponse } from "next/server";
import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { buildGoCardlessAuthorizeUrl } from "@/lib/gocardless/oauth";
import {
  getResolvedGoCardlessEnv,
  resolveGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";

type OnboardBody = {
  providerId?: string;
};

const PLATFORM_UNAVAILABLE_MESSAGE =
  "GoCardless unavailable. Activora is still configuring Direct Debit.";

export async function POST(request: Request) {
  const body = (await request.json()) as OnboardBody;
  const providerId = body.providerId?.trim() || "demo-provider-1";
  const resolved = await resolveGoCardlessPlatformConfig(request);

  if (!resolved.isClubConnectAvailable) {
    if (isDevelopmentEnvironment()) {
      const baseUrl = new URL(request.url).origin;
      return NextResponse.json({
        url: `${baseUrl}/club/finance?tab=payment-providers&gocardless=connected&mock=1`,
        providerId,
        mock: true,
      });
    }

    return NextResponse.json(
      { error: PLATFORM_UNAVAILABLE_MESSAGE, code: "not_configured" },
      { status: 503 },
    );
  }

  try {
    const config = await getResolvedGoCardlessEnv(request);
    const url = buildGoCardlessAuthorizeUrl({ providerId, config });
    return NextResponse.json({ url, providerId, mock: false });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not start GoCardless connect.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
