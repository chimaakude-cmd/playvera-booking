import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsReadActor } from "@/lib/admin-users/api-auth";
import {
  fetchAdminPaymentProviders,
  isProviderStripeConnected,
} from "@/lib/admin/payment-providers-data";
import {
  STRIPE_CONNECT_STATUS_LABELS,
  type StripeConnectStatus,
} from "@/lib/stripe-connect/types";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await fetchAdminPaymentProviders();
  const providers = result.providers
    .filter((row) => isProviderStripeConnected(row.stripeStatus))
    .map((row) => ({
      providerId: row.providerId,
      clubName: row.clubName,
      stripeStatus: row.stripeStatus,
      stripeStatusLabel:
        STRIPE_CONNECT_STATUS_LABELS[row.stripeStatus as StripeConnectStatus],
    }));

  return NextResponse.json({
    providers,
    count: providers.length,
    dataSource: result.dataSource,
  });
}
