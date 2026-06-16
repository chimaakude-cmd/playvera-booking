import { NextRequest, NextResponse } from "next/server";
import { requireManageAdminActor } from "@/lib/admin-users/api-auth";
import { getServerAuditLog } from "@/lib/admin-users/server-store";

export async function GET(request: NextRequest) {
  const auth = requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const audit = await getServerAuditLog();
  return NextResponse.json({ audit });
}
