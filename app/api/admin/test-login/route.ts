import { NextResponse } from "next/server";
import { isAdminTestLoginEnabled } from "@/lib/admin-users/production-gates";

export async function POST() {
  if (!isAdminTestLoginEnabled()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
