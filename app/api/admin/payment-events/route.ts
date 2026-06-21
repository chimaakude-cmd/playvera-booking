import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsReadActor } from "@/lib/admin-users/api-auth";
import {
  fetchPaymentEvents,
  type PaymentEventFilter,
} from "@/lib/payments/payment-events-data";

function parseFilter(value: string | null): PaymentEventFilter {
  if (value === "success" || value === "pending" || value === "failed") {
    return value;
  }
  return "all";
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const filter = parseFilter(searchParams.get("filter"));
  const providerId = searchParams.get("providerId") ?? undefined;
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 100), 1),
    500,
  );

  const events = await fetchPaymentEvents({ filter, providerId, limit });

  return NextResponse.json({ events, filter });
}
