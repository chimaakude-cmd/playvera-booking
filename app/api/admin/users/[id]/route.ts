import { NextRequest, NextResponse } from "next/server";
import { requireManageAdminActor } from "@/lib/admin-users/api-auth";
import {
  disableServerAdminUser,
  getServerAdminUserById,
  resendServerAdminInvite,
  updateServerAdminUser,
} from "@/lib/admin-users/server-store";
import { adminUsersErrorMessage, adminUsersErrorStatus } from "@/lib/admin-users/errors";
import type { UpdateAdminUserInput } from "@/lib/admin-users/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = requireManageAdminActor(_request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const user = await getServerAdminUserById(id);
    if (!user) {
      return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
    }

    const { passwordHash: _passwordHash, inviteToken: _inviteToken, ...publicUser } = user;
    return NextResponse.json({ user: publicUser });
  } catch (error) {
    console.error("[Admin users] GET /api/admin/users/[id] failed:", error);
    return NextResponse.json(
      {
        error: adminUsersErrorMessage(error, "Failed to load admin user."),
      },
      { status: adminUsersErrorStatus(error) },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as UpdateAdminUserInput;
    const user = await updateServerAdminUser(id, body, auth.actor);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[Admin users] PATCH /api/admin/users/[id] failed:", error);
    const status = adminUsersErrorStatus(error);
    return NextResponse.json(
      { error: adminUsersErrorMessage(error, "Failed to update admin user.") },
      { status: status === 503 ? status : 400 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const user = await disableServerAdminUser(id, auth.actor);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[Admin users] DELETE /api/admin/users/[id] failed:", error);
    const status = adminUsersErrorStatus(error);
    return NextResponse.json(
      { error: adminUsersErrorMessage(error, "Failed to disable admin user.") },
      { status: status === 503 ? status : 400 },
    );
  }
}
