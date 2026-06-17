import { NextRequest, NextResponse } from "next/server";
import { requireManageAdminActor } from "@/lib/admin-users/api-auth";
import {
  isAdminInviteEmailConfigured,
  sendAdminInviteEmail,
} from "@/lib/admin-users/invite-email";
import { resendServerAdminInvite } from "@/lib/admin-users/server-store";
import { adminUsersErrorMessage, adminUsersErrorStatus } from "@/lib/admin-users/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireManageAdminActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const result = await resendServerAdminInvite(id, auth.actor);
    const emailConfigured = isAdminInviteEmailConfigured();
    let emailSent = false;

    if (emailConfigured) {
      const emailResult = await sendAdminInviteEmail({
        to: result.user.email,
        name: result.user.name,
        role: result.user.role,
        inviteLink: result.inviteLink,
      });

      if (!emailResult.ok) {
        return NextResponse.json({ error: emailResult.error }, { status: 500 });
      }

      emailSent = emailResult.sent;
    }

    return NextResponse.json({
      ...result,
      emailSent,
      emailConfigured,
    });
  } catch (error) {
    console.error("[Admin users] POST /api/admin/users/[id]/resend-invite failed:", error);
    const status = adminUsersErrorStatus(error);
    return NextResponse.json(
      {
        error: adminUsersErrorMessage(error, "Failed to resend invite."),
      },
      { status: status === 503 ? status : 400 },
    );
  }
}
