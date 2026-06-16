import { NextResponse } from "next/server";
import { fetchAdminProvidersList } from "@/lib/admin/providers-data";

export async function GET() {
  const result = await fetchAdminProvidersList();
  return NextResponse.json(result);
}
