import { NextRequest, NextResponse } from "next/server";
import {
  archiveSessionById,
  getSessionBookingCount,
  hardDeleteSessionById,
  publishSessionById,
  SESSION_HAS_BOOKINGS_MESSAGE,
} from "@/lib/data/session-delete";
import { isSupabaseConfigured } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  action?: unknown;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const bookingCount = await getSessionBookingCount(id);
    if (bookingCount > 0) {
      return NextResponse.json(
        { error: SESSION_HAS_BOOKINGS_MESSAGE, hasBookings: true },
        { status: 409 },
      );
    }

    await hardDeleteSessionById(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete session.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "archive" && body.action !== "publish") {
    return NextResponse.json(
      { error: 'Expected action "archive" or "publish".' },
      { status: 400 },
    );
  }

  try {
    if (body.action === "archive") {
      await archiveSessionById(id);
    } else {
      await publishSessionById(id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update session.",
      },
      { status: 500 },
    );
  }
}
