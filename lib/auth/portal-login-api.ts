import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import {
  isValidLoginEmail,
  loginErrorMessage,
  type LoginErrorKind,
} from "@/lib/auth/login-messages";
import {
  authenticatePortalUser,
  type PortalLoginRole,
} from "@/lib/auth/portal-login-server";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";

type PortalLoginBody = {
  email?: string;
  password?: string;
};

function portalFromPath(pathname: string): PortalLoginRole | null {
  if (pathname.includes("/club/")) {
    return "club";
  }
  if (pathname.includes("/parent/")) {
    return "parent";
  }
  if (pathname.includes("/organisation/")) {
    return "organisation";
  }
  return null;
}

export async function handlePortalLoginPost(request: NextRequest) {
  const portal = portalFromPath(request.nextUrl.pathname);

  if (!portal) {
    return NextResponse.json({ error: "Invalid portal." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: loginErrorMessage("generic"), kind: "generic" satisfies LoginErrorKind },
      { status: 503 },
    );
  }

  let body: PortalLoginBody;
  try {
    body = (await request.json()) as PortalLoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !isValidLoginEmail(email)) {
    return NextResponse.json(
      {
        error: loginErrorMessage("invalidEmail"),
        kind: "invalidEmail" satisfies LoginErrorKind,
      },
      { status: 400 },
    );
  }

  if (!password) {
    return NextResponse.json(
      {
        error: loginErrorMessage("wrongPassword"),
        kind: "wrongPassword" satisfies LoginErrorKind,
      },
      { status: 400 },
    );
  }

  const isProduction = process.env.NODE_ENV === "production";

  try {
    const cookieResponse = NextResponse.json({ ok: true });
    const supabase = createSupabaseRouteClient(request, cookieResponse);
    const result = await authenticatePortalUser(
      portal,
      email,
      password,
      supabase,
    );

    if (!result.ok) {
      const status =
        result.kind === "wrongPassword" || result.kind === "generic"
          ? 401
          : result.kind === "wrongPortal"
            ? 403
            : 400;

      return NextResponse.json(
        {
          error: loginErrorMessage(result.kind),
          kind: result.kind,
        },
        { status },
      );
    }

    const jsonResponse = NextResponse.json({
      ok: true,
      user: result.user,
      redirectTo: result.redirectTo,
    });

    for (const cookie of cookieResponse.cookies.getAll()) {
      jsonResponse.cookies.set(cookie.name, cookie.value);
    }

    jsonResponse.cookies.set(AUTH_ROLE_COOKIE, portal, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
    });

    return jsonResponse;
  } catch (error) {
    console.error(`[${portal}-auth-login] Unexpected error:`, error);
    return NextResponse.json(
      {
        error: loginErrorMessage("generic"),
        kind: "generic" satisfies LoginErrorKind,
      },
      { status: 500 },
    );
  }
}
