import { NextResponse } from "next/server";
import {
  buildStripeConnectErrorResponse,
  STRIPE_CONNECT_LOG_PREFIX,
  type StripeConnectErrorCode,
} from "@/lib/stripe/errors";
import { startStripeConnect } from "@/lib/stripe/connect-start";
import { STRIPE_PLATFORM_NAME } from "@/lib/stripe/constants";

type OnboardBody = {
  providerId?: string;
  stripeAccountId?: string | null;
  refresh?: boolean;
};

function mapStartReasonToCode(reason: string): StripeConnectErrorCode {
  if (reason === "not_configured" || reason === "missing_provider") {
    return reason === "not_configured" ? "not_configured" : "transient";
  }
  return "transient";
}

export async function POST(request: Request) {
  const body = (await request.json()) as OnboardBody;
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
      route: "/api/stripe/connect/onboard",
      step: "onboard.failed",
      reason: result.reason,
      providerId: result.providerId,
      stripeCode: result.stripeCode,
      adminDetail: result.adminDetail,
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
    route: "/api/stripe/connect/onboard",
    step: "onboard.success",
    providerId: result.providerId,
    accountId: result.stripeAccountId,
  });

  return NextResponse.json({
    url: result.url,
    stripeAccountId: result.stripeAccountId,
    providerId: result.providerId,
    refresh: Boolean(body.refresh),
    platform: STRIPE_PLATFORM_NAME,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await startStripeConnect(request, {
    queryProviderId: searchParams.get("providerId"),
    stripeAccountId: searchParams.get("stripeAccountId"),
    refresh: searchParams.get("refresh") === "1",
  });

  if (!result.ok) {
    const payload = buildStripeConnectErrorResponse(
      new Error(result.adminDetail ?? result.message),
      {
        route: "/api/stripe/connect/onboard",
        step: "onboard.get.failed",
        reason: result.reason,
        providerId: result.providerId,
        stripeCode: result.stripeCode,
      },
    );

    return NextResponse.json(
      {
        ...payload,
        reason: result.reason,
        providerId: result.providerId,
        stripeCode: result.stripeCode,
      },
      { status: result.reason === "not_configured" ? 503 : 500 },
    );
  }

  return NextResponse.redirect(result.url);
}
