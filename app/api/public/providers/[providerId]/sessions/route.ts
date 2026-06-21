import { NextResponse } from "next/server";
import { getBookableActivitiesForClub } from "@/lib/sessions/public-server";

type RouteContext = {
  params: Promise<{ providerId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { providerId } = await context.params;
  const sessions = await getBookableActivitiesForClub(providerId);

  return NextResponse.json({ sessions });
}
