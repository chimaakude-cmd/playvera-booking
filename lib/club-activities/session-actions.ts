import { getBookingsBySession } from "@/lib/bookings";
import { dataLayer } from "@/lib/data";
import {
  archiveActivities,
  setActivityVisibility,
  unarchiveActivity,
} from "./storage";
import type { ActivityRow } from "./types";

export function getActiveBookingCount(row: ActivityRow): number {
  const localBookings = getBookingsBySession(row.id).filter(
    (booking) => booking.status !== "cancelled",
  ).length;

  return Math.max(
    localBookings,
    row.occupancy.filled,
    row.session.bookings ?? 0,
  );
}

export function canHardDeleteSession(row: ActivityRow): boolean {
  return getActiveBookingCount(row) === 0;
}

async function patchSessionAction(
  id: string,
  action: "archive" | "publish",
): Promise<void> {
  const response = await fetch(`/api/club/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (response.ok) {
    return;
  }

  const existing = await dataLayer.sessions.getById(id);
  if (!existing) {
    return;
  }

  const {
    id: _id,
    bookings: _bookings,
    createdAt: _createdAt,
    ...rest
  } = existing;

  await dataLayer.sessions.update(id, {
    ...rest,
    published: action === "publish",
  });
}

export async function archiveSessionActivity(row: ActivityRow): Promise<void> {
  archiveActivities([row.id]);
  setActivityVisibility(row.id, false);
  await patchSessionAction(row.id, "archive");
}

export async function publishSessionActivity(row: ActivityRow): Promise<void> {
  unarchiveActivity(row.id);
  setActivityVisibility(row.id, true);
  await patchSessionAction(row.id, "publish");
}

export async function deleteSessionActivity(row: ActivityRow): Promise<void> {
  if (!canHardDeleteSession(row)) {
    throw new Error(
      "This session has existing bookings and cannot be permanently deleted.",
    );
  }

  const response = await fetch(`/api/club/sessions/${row.id}`, {
    method: "DELETE",
  });

  if (response.ok) {
    return;
  }

  if (response.status === 409) {
    throw new Error(
      "This session has existing bookings and cannot be permanently deleted.",
    );
  }

  if (response.status === 503 || response.status === 404) {
    await dataLayer.sessions.delete(row.id);
    return;
  }

  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  throw new Error(body?.error ?? "Could not delete this session.");
}

export async function bulkArchiveSessions(rows: ActivityRow[]): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  archiveActivities(rows.map((row) => row.id));
  for (const row of rows) {
    setActivityVisibility(row.id, false);
  }

  const response = await fetch("/api/club/sessions/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "archive",
      ids: rows.map((row) => row.id),
    }),
  });

  if (!response.ok) {
    await Promise.all(
      rows.map((row) => patchSessionAction(row.id, "archive")),
    );
  }

  return rows.length;
}

export async function bulkPublishSessions(rows: ActivityRow[]): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  for (const row of rows) {
    unarchiveActivity(row.id);
    setActivityVisibility(row.id, true);
  }

  const response = await fetch("/api/club/sessions/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "publish",
      ids: rows.map((row) => row.id),
    }),
  });

  if (!response.ok) {
    await Promise.all(
      rows.map((row) => patchSessionAction(row.id, "publish")),
    );
  }

  return rows.length;
}

export async function bulkDeleteSessions(
  rows: ActivityRow[],
): Promise<{ deleted: number; skipped: number }> {
  let deleted = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!canHardDeleteSession(row)) {
      skipped += 1;
      continue;
    }

    await deleteSessionActivity(row);
    deleted += 1;
  }

  return { deleted, skipped };
}
