import { NextRequest, NextResponse } from "next/server";
import { requireManageAdminActor } from "@/lib/admin-users/api-auth";
import { getServerAuditLog } from "@/lib/admin-users/server-store";
import { adminUsersErrorMessage, adminUsersErrorStatus } from "@/lib/admin-users/errors";

export async function GET(request: NextRequest) {
  const auth = await requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const audit = await getServerAuditLog();
    return NextResponse.json({ audit });
  } catch (error) {
    console.error("[Admin users] GET /api/admin/users/audit failed:", error);
    return NextResponse.json(
      {
        error: adminUsersErrorMessage(error, "Failed to load admin audit log."),
      },
      { status: adminUsersErrorStatus(error) },
    );
  }
}
