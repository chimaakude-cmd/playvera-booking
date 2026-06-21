import { NextRequest, NextResponse } from "next/server";
import { deleteProviderPermanently } from "@/lib/admin/provider-delete";
import {
  isValidLoginEmail,
  loginErrorMessage,
} from "@/lib/auth/login-messages";
import { resolveProviderIdForAuthUser } from "@/lib/club-profile/server";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

type DeleteClubAccountBody = {
  email?: string;
  password?: string;
  confirmPhrase?: string;
};

const CONFIRM_PHRASE = "DELETE MY CLUB";

async function verifyClubOwnerPassword(
  email: string,
  password: string,
): Promise<{ ok: true; authUserId: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseCookieClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData.session?.user?.id) {
    const sessionEmail = sessionData.session.user.email?.trim().toLowerCase() ?? "";
    if (sessionEmail !== email) {
      return { ok: false, error: "Email must match your signed-in club account." };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (verifyError) {
      return { ok: false, error: loginErrorMessage("wrongPassword") };
    }

    return { ok: true, authUserId: sessionData.session.user.id };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: loginErrorMessage("generic") };
  }

  const serviceClient = createSupabaseServiceRoleClient();
  const { data: signInData, error: signInError } =
    await serviceClient.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.user?.id) {
    return { ok: false, error: loginErrorMessage("wrongPassword") };
  }

  return { ok: true, authUserId: signInData.user.id };
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  let body: DeleteClubAccountBody;
  try {
    body = (await request.json()) as DeleteClubAccountBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const confirmPhrase = body.confirmPhrase?.trim() ?? "";

  if (confirmPhrase !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: `Type "${CONFIRM_PHRASE}" to confirm deletion.` },
      { status: 400 },
    );
  }

  if (!email || !isValidLoginEmail(email) || !password) {
    return NextResponse.json(
      { error: "Valid email and password are required to confirm deletion." },
      { status: 400 },
    );
  }

  const verification = await verifyClubOwnerPassword(email, password);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 401 });
  }

  const supabase = await createSupabaseCookieClient();
  const providerId = await resolveProviderIdForAuthUser(
    supabase,
    verification.authUserId,
  );

  if (!providerId) {
    return NextResponse.json(
      { error: "No club account found for this user." },
      { status: 404 },
    );
  }

  const result = await deleteProviderPermanently(providerId, {
    actorId: verification.authUserId,
    actorType: "club_owner",
    actorEmail: email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({
    ok: true,
    providerId: result.providerId,
    financeWarning: result.financeWarning,
  });
}
