import { NextRequest, NextResponse } from "next/server";
import { requireManageAdminActor } from "@/lib/admin-users/api-auth";
import {
  isAdminInviteEmailConfigured,
  sendAdminInviteEmail,
} from "@/lib/admin-users/invite-email";
import {
  createServerAdminInvite,
  getServerAdminUsersPublic,
} from "@/lib/admin-users/server-store";
import { adminUsersErrorMessage, adminUsersErrorStatus } from "@/lib/admin-users/errors";
import type { InviteAdminUserInput } from "@/lib/admin-users/types";

export async function GET(request: NextRequest) {
  const auth = requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const users = await getServerAdminUsersPublic();
    return NextResponse.json({
      users,
      meta: { emailConfigured: isAdminInviteEmailConfigured() },
    });
  } catch (error) {
    console.error("[Admin users] GET /api/admin/users failed:", error);
    return NextResponse.json(
      {
        error: adminUsersErrorMessage(error, "Failed to load admin users."),
      },
      { status: adminUsersErrorStatus(error) },
    );
  }
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
    const emailConfigured = isAdminInviteEmailConfigured();
    let emailSent = false;

    if (emailConfigured) {
      const emailResult = await sendAdminInviteEmail({
        to: body.email.trim(),
        name: body.name.trim(),
        role: body.role,
        inviteLink: result.inviteLink,
      });

      if (!emailResult.ok) {
        return NextResponse.json({ error: emailResult.error }, { status: 500 });
      }

      emailSent = emailResult.sent;
    }

    return NextResponse.json(
      {
        ...result,
        emailSent,
        emailConfigured,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Admin users] POST /api/admin/users failed:", error);
    const status = adminUsersErrorStatus(error);
    return NextResponse.json(
      {
        error: adminUsersErrorMessage(error, "Failed to invite admin user."),
      },
      { status: status === 503 ? status : 400 },
    );
  }
}
