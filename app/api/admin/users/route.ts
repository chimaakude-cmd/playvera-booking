import { NextRequest, NextResponse } from "next/server";
import { requireManageAdminActor } from "@/lib/admin-users/api-auth";
import {
  createServerAdminInvite,
  getServerAdminUsersPublic,
} from "@/lib/admin-users/server-store";
import type { InviteAdminUserInput } from "@/lib/admin-users/types";

export async function GET(request: NextRequest) {
  const auth = requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const users = await getServerAdminUsersPublic();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const auth = requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as InviteAdminUserInput;
    if (!body.name?.trim() || !body.email?.trim() || !body.role) {
      return NextResponse.json(
        { error: "Name, email, and role are required." },
        { status: 400 },
      );
    }

    const result = await createServerAdminInvite(body, auth.actor);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to invite admin user." },
      { status: 400 },
    );
  }
}
