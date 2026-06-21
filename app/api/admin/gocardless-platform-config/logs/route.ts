import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsReadActor } from "@/lib/admin-users/api-auth";
import { listGoCardlessPlatformLogs } from "@/lib/gocardless/platform-config";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam) || 50, 200) : 50;
  const logs = await listGoCardlessPlatformLogs(limit);

  return NextResponse.json({ logs });
}
