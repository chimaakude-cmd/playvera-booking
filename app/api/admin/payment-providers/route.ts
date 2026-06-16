import { NextResponse } from "next/server";
import { fetchAdminPaymentProviders } from "@/lib/admin/payment-providers-data";

export async function GET() {
  const result = await fetchAdminPaymentProviders();
  return NextResponse.json(result);
}
