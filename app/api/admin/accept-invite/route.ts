import { NextRequest, NextResponse } from "next/server";
import { acceptServerAdminInvite, getServerAdminInviteByToken } from "@/lib/admin-users/server-store";
import { adminUsersErrorMessage, adminUsersErrorStatus } from "@/lib/admin-users/errors";
import { isSupabaseConfigured, isSupabaseServiceRoleConfigured } from "@/lib/supabase";

const SERVICE_ROLE_MISSING_MESSAGE =
  "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.";

function acceptInviteErrorStatus(error: string): number {
  if (error.includes("service role is not configured")) {
    return 503;
  }

  if (
    error.includes("invalid or has expired") ||
    error.includes("not found for this invite")
  ) {
    return 404;
  }

  return 400;
}
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
  try {
    const invite = await getServerAdminInviteByToken(token);
    if (!invite) return NextResponse.json({ error: "Invite link is invalid or has expired." }, { status: 404 });
    return NextResponse.json({ fullName: invite.fullName, email: invite.email, role: invite.role, expiresAt: invite.expiresAt });
  } catch (error) {
    return NextResponse.json(
      { error: adminUsersErrorMessage(error, "Failed to load invite.") },
      { status: adminUsersErrorStatus(error) },
    );
  }
}
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  if (!isSupabaseServiceRoleConfigured()) {
    console.error("[accept-invite] POST blocked: SUPABASE_SERVICE_ROLE_KEY is not configured.");
    return NextResponse.json({ error: SERVICE_ROLE_MISSING_MESSAGE }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = body.token?.trim();
    const password = body.password ?? "";

    if (!token) {
      return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
    }

    const result = await acceptServerAdminInvite(token, password);

    if (!result.ok) {
      console.error("[accept-invite] POST failed:", { error: result.error });
      return NextResponse.json(
        { error: result.error },
        { status: acceptInviteErrorStatus(result.error) },
      );
    }

    return NextResponse.json({ ok: true, email: result.email, name: result.name });
  } catch (error) {
    console.error("[accept-invite] POST unexpected error:", error);
    return NextResponse.json(
      { error: adminUsersErrorMessage(error, "Failed to accept invite.") },
      { status: adminUsersErrorStatus(error) },
    );
  }
}
