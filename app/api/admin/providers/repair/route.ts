import { NextRequest, NextResponse } from "next/server";
import { requireManageProvidersActor } from "@/lib/admin-users/api-auth";
import {
  findOrphanedClubAuthUsers,
  repairProviderProfileForAuthUser,
} from "@/lib/admin/provider-repair";

export async function GET(request: NextRequest) {
  const auth = await requireManageProvidersActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const orphanedClubAuthUsers = await findOrphanedClubAuthUsers();
  return NextResponse.json({ orphanedClubAuthUsers });
}

export async function POST(request: NextRequest) {
  const auth = await requireManageProvidersActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { authUserId?: string };
  try {
    body = (await request.json()) as { authUserId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const authUserId = body.authUserId?.trim();
  if (!authUserId) {
    return NextResponse.json(
      { error: "authUserId is required." },
      { status: 400 },
    );
  }

  const result = await repairProviderProfileForAuthUser(authUserId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    providerId: result.providerId,
    created: result.created,
  });
}
