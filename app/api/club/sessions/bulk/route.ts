import { NextRequest, NextResponse } from "next/server";
import {
  archiveSessionById,
  getSessionBookingCount,
  hardDeleteSessionById,
  publishSessionById,
  SESSION_HAS_BOOKINGS_MESSAGE,
} from "@/lib/data/session-delete";
import { isSupabaseConfigured } from "@/lib/supabase";

type BulkBody = {
  action?: unknown;
  ids?: unknown;
};

function parseIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const ids = value.filter((item): item is string => typeof item === "string");
  return ids.length > 0 ? ids : null;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  let body: BulkBody = {};
  try {
    body = (await request.json()) as BulkBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = body.action;
  const ids = parseIds(body.ids);

  if (!ids) {
    return NextResponse.json({ error: "At least one session id is required." }, { status: 400 });
  }

  if (action !== "archive" && action !== "publish" && action !== "delete") {
    return NextResponse.json(
      { error: 'Expected action "archive", "publish", or "delete".' },
      { status: 400 },
    );
  }

  try {
    if (action === "archive") {
      await Promise.all(ids.map((id) => archiveSessionById(id)));
      return NextResponse.json({ ok: true, count: ids.length });
    }

    if (action === "publish") {
      await Promise.all(ids.map((id) => publishSessionById(id)));
      return NextResponse.json({ ok: true, count: ids.length });
    }

    let deleted = 0;
    let skipped = 0;

    for (const id of ids) {
      const bookingCount = await getSessionBookingCount(id);
      if (bookingCount > 0) {
        skipped += 1;
        continue;
      }

      await hardDeleteSessionById(id);
      deleted += 1;
    }

    return NextResponse.json({
      ok: true,
      deleted,
      skipped,
      message:
        skipped > 0
          ? `${skipped} session${skipped === 1 ? "" : "s"} skipped due to bookings.`
          : undefined,
      error: deleted === 0 && skipped > 0 ? SESSION_HAS_BOOKINGS_MESSAGE : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not complete bulk action.",
      },
      { status: 500 },
    );
  }
}
