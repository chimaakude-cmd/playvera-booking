import { NextResponse } from "next/server";
import {
  isValidLoginEmail,
  loginErrorMessage,
  type LoginErrorKind,
} from "@/lib/auth/login-messages";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";

type ChangePasswordBody = {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: loginErrorMessage("generic") },
      { status: 503 },
    );
  }

  let body: ChangePasswordBody;
  try {
    body = (await request.json()) as ChangePasswordBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required." },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseCookieClient();
    const { data: sessionData } = await supabase.auth.getSession();
    let activeClient = supabase;

    if (!sessionData.session?.user) {
      if (!email || !isValidLoginEmail(email)) {
        return NextResponse.json(
          {
            error: loginErrorMessage("invalidEmail"),
            kind: "invalidEmail" satisfies LoginErrorKind,
          },
          { status: 400 },
        );
      }

      const serviceClient = createSupabaseServiceRoleClient();
      const { data: signInData, error: signInError } =
        await serviceClient.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

      if (signInError || !signInData.session?.access_token) {
        return NextResponse.json(
          {
            error: loginErrorMessage("wrongPassword"),
            kind: "wrongPassword" satisfies LoginErrorKind,
          },
          { status: 401 },
        );
      }

      const { error: updateError } = await serviceClient.auth.admin.updateUserById(
        signInData.user.id,
        { password: newPassword },
      );

      if (updateError) {
        console.error("[change-password] admin.updateUserById failed:", updateError);
        return NextResponse.json(
          { error: loginErrorMessage("generic") },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true });
    }

    const sessionEmail = sessionData.session.user.email?.trim().toLowerCase() ?? "";
    if (sessionEmail) {
      const { error: verifyError } = await activeClient.auth.signInWithPassword({
        email: sessionEmail,
        password: currentPassword,
      });

      if (verifyError) {
        return NextResponse.json(
          {
            error: loginErrorMessage("wrongPassword"),
            kind: "wrongPassword" satisfies LoginErrorKind,
          },
          { status: 401 },
        );
      }
    }

    const { error: updateError } = await activeClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[change-password] updateUser failed:", updateError);
      return NextResponse.json(
        { error: loginErrorMessage("generic") },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[change-password] Unexpected error:", error);
    return NextResponse.json(
      { error: loginErrorMessage("generic") },
      { status: 500 },
    );
  }
}
