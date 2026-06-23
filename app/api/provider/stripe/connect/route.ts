import { NextResponse } from "next/server";
import {
  STRIPE_CONNECT_LOG_PREFIX,
  type StripeConnectErrorCode,
} from "@/lib/stripe/errors";
import { startStripeConnect } from "@/lib/stripe/connect-start";
import { STRIPE_PLATFORM_NAME } from "@/lib/stripe/constants";

type ConnectBody = {
  providerId?: string;
  stripeAccountId?: string | null;
  refresh?: boolean;
};

function mapStartReasonToCode(reason: string): StripeConnectErrorCode {
  if (reason === "not_configured") {
    return "not_configured";
  }
  if (reason === "missing_provider") {
    return "transient";
  }
  return "transient";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ConnectBody;
  const result = await startStripeConnect(request, {
    queryProviderId: body.providerId,
    stripeAccountId: body.stripeAccountId,
    refresh: body.refresh,
  });

  if (!result.ok) {
    const code = mapStartReasonToCode(result.reason);
    const status =
      code === "platform_unavailable" || code === "not_configured" ? 503 : 500;

    console.error(STRIPE_CONNECT_LOG_PREFIX, {
      route: "/api/provider/stripe/connect",
      step: "connect.failed",
      reason: result.reason,
      providerId: result.providerId,
      stripeCode: result.stripeCode,
      adminDetail: result.adminDetail,
      message: result.message,
    });

    return NextResponse.json(
      {
        error: result.message,
        code,
        reason: result.reason,
        providerId: result.providerId,
        stripeCode: result.stripeCode,
        ...(result.adminDetail ? { adminDetail: result.adminDetail } : {}),
      },
      { status },
    );
  }

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    route: "/api/provider/stripe/connect",
    step: "connect.success",
    providerId: result.providerId,
    accountId: result.stripeAccountId,
    redirectUrl: result.url,
  });

  return NextResponse.json({
    url: result.url,
    onboarding: { url: result.url },
    stripeAccountId: result.stripeAccountId,
    providerId: result.providerId,
    refresh: Boolean(body.refresh),
    platform: STRIPE_PLATFORM_NAME,
  });
}
