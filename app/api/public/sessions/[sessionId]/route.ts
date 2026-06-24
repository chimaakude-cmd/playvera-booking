import { NextResponse } from "next/server";
import { getPublicSessionById } from "@/lib/sessions/public-server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const session = await getPublicSessionById(sessionId);

  if (!session) {
    return NextResponse.json({ session: null }, { status: 404 });
  }

  return NextResponse.json({ session });
}
