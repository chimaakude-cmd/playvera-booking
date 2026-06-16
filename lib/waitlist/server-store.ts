import type { WaitlistEntry, NewWaitlistEntry } from "./types";

/**
 * Server-side waitlist store until Supabase waitlist_entries is wired.
 * API routes and queue logic read/write here; the client mirrors in localStorage.
 */

const entries = new Map<string, WaitlistEntry>();
const inviteIndex = new Map<string, string>();
const reservedSpots = new Map<string, number>();

function getNextPosition(sessionId: string): number {
  const sessionEntries = [...entries.values()].filter(
    (entry) => entry.sessionId === sessionId,
  );
  if (sessionEntries.length === 0) {
    return 1;
  }
  return Math.max(...sessionEntries.map((entry) => entry.position)) + 1;
}

export function getServerWaitlistEntries(): WaitlistEntry[] {
  return [...entries.values()].sort(
    (a, b) => a.sessionId.localeCompare(b.sessionId) || a.position - b.position,
  );
}

export function getServerWaitlistEntry(id: string): WaitlistEntry | null {
  return entries.get(id) ?? null;
}

export function getServerWaitlistEntryByToken(
  token: string,
): WaitlistEntry | null {
  const id = inviteIndex.get(token);
  if (!id) {
    return null;
  }
  return entries.get(id) ?? null;
}

export function getServerWaitlistEntriesForSession(
  sessionId: string,
): WaitlistEntry[] {
  return getServerWaitlistEntries().filter(
    (entry) => entry.sessionId === sessionId,
  );
}

export function createServerWaitlistEntry(
  input: NewWaitlistEntry,
): WaitlistEntry {
  const entry: WaitlistEntry = {
    ...input,
    id: crypto.randomUUID(),
    position: getNextPosition(input.sessionId),
    joinedAt: new Date().toISOString(),
    status: "WAITLIST_PENDING",
    inviteToken: null,
    inviteExpiresAt: null,
  };
  entries.set(entry.id, entry);
  return entry;
}

export function updateServerWaitlistEntry(
  id: string,
  updates: Partial<WaitlistEntry>,
): WaitlistEntry | null {
  const current = entries.get(id);
  if (!current) {
    return null;
  }

  const previousToken = current.inviteToken;
  const next: WaitlistEntry = { ...current, ...updates };
  entries.set(id, next);

  if (previousToken && previousToken !== next.inviteToken) {
    inviteIndex.delete(previousToken);
  }
  if (next.inviteToken) {
    inviteIndex.set(next.inviteToken, id);
  }

  return next;
}

export function getReservedSpotCount(sessionId: string): number {
  return reservedSpots.get(sessionId) ?? 0;
}

export function reserveSpot(sessionId: string): void {
  reservedSpots.set(sessionId, getReservedSpotCount(sessionId) + 1);
}

export function releaseSpot(sessionId: string): void {
  const next = Math.max(0, getReservedSpotCount(sessionId) - 1);
  if (next === 0) {
    reservedSpots.delete(sessionId);
  } else {
    reservedSpots.set(sessionId, next);
  }
}

export function syncServerWaitlistEntry(entry: WaitlistEntry): WaitlistEntry {
  entries.set(entry.id, entry);
  if (entry.inviteToken) {
    inviteIndex.set(entry.inviteToken, entry.id);
  }
  return entry;
}

export function getServerActiveWaitlistCount(sessionId: string): number {
  return getServerWaitlistEntriesForSession(sessionId).filter(
    (entry) =>
      entry.status === "WAITLIST_PENDING" ||
      entry.status === "INVITED_TO_BOOK" ||
      entry.status === "PAYMENT_PENDING",
  ).length;
}
