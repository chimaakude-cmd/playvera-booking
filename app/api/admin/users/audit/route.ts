import { NextRequest, NextResponse } from "next/server";
import { requireManageAdminActor } from "@/lib/admin-users/api-auth";
import { getServerAuditLog } from "@/lib/admin-users/server-store";

export async function GET(request: NextRequest) {
  const auth = requireManageAdminActor(request);
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to load admin audit log.",
      },
      { status: 500 },
    );
  }
}
