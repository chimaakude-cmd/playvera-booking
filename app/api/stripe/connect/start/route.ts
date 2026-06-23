import { NextResponse } from "next/server";
import {
  buildStripeFinanceRedirectUrl,
  startStripeConnect,
} from "@/lib/stripe/connect-start";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await startStripeConnect(request, {
    queryProviderId: searchParams.get("providerId"),
    stripeAccountId: searchParams.get("stripeAccountId"),
    refresh: searchParams.get("refresh") === "1",
  });

  if (!result.ok) {
    return NextResponse.redirect(
      buildStripeFinanceRedirectUrl(request, {
        stripe: "error",
        reason: result.reason,
      }),
    );
  }

  return NextResponse.redirect(result.url);
}
