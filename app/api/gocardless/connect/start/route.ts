import { NextResponse } from "next/server";
import {
  buildGoCardlessFinanceRedirectUrl,
  startGoCardlessConnect,
} from "@/lib/gocardless/connect-start";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await startGoCardlessConnect(
    request,
    searchParams.get("providerId"),
  );

  if (!result.ok) {
    return NextResponse.redirect(
      buildGoCardlessFinanceRedirectUrl(request, {
        gocardless: "error",
        reason: result.reason,
      }),
    );
  }

  return NextResponse.redirect(result.url);
}
