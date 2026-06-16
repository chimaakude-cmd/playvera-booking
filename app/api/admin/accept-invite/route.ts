import { NextRequest, NextResponse } from "next/server";
import { acceptServerAdminInvite, getServerAdminInviteByToken } from "@/lib/admin-users/server-store";
import { isSupabaseConfigured } from "@/lib/supabase";
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
  try {
    const invite = await getServerAdminInviteByToken(token);
    if (!invite) return NextResponse.json({ error: "Invite link is invalid or has expired." }, { status: 404 });
    return NextResponse.json({ fullName: invite.fullName, email: invite.email, role: invite.role, expiresAt: invite.expiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load invite." }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  try {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = body.token?.trim(); const password = body.password ?? "";
    if (!token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
    const result = await acceptServerAdminInvite(token, password);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, email: result.email, name: result.name });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to accept invite." }, { status: 500 });
  }
}
