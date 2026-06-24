import { NextRequest, NextResponse } from "next/server";
import { collectPublicSessionDiagnostics } from "@/lib/sessions/public-diagnostics";
import { isPublicDiagnoseAllowed } from "@/lib/sessions/public-diagnose-auth";
import { getPublicSessionById } from "@/lib/sessions/public-server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;
  const diagnose = request.nextUrl.searchParams.get("diagnose") === "1";

  if (diagnose && isPublicDiagnoseAllowed(request)) {
    const diagnostics = await collectPublicSessionDiagnostics(sessionId);
    return NextResponse.json(diagnostics);
  }

  const session = await getPublicSessionById(sessionId);

  if (!session) {
    return NextResponse.json({ session: null }, { status: 404 });
  }

  return NextResponse.json({ session });
}
