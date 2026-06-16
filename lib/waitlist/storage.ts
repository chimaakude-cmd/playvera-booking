import type {
  NewWaitlistEntry,
  WaitlistEntry,
  WaitlistEntryStatus,
} from "./types";
import { ACTIVE_WAITLIST_STATUSES, WAITLIST_STORAGE_KEY } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): WaitlistEntry[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as WaitlistEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: WaitlistEntry[]): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(entries));
}

export function getWaitlistEntries(): WaitlistEntry[] {
  return readAll();
}

export function getWaitlistEntryById(id: string): WaitlistEntry | undefined {
  return readAll().find((entry) => entry.id === id);
}

export function getWaitlistEntryByToken(
  token: string,
): WaitlistEntry | undefined {
  return readAll().find((entry) => entry.inviteToken === token);
}

export function getWaitlistEntriesForSession(
  sessionId: string,
): WaitlistEntry[] {
  return readAll()
    .filter((entry) => entry.sessionId === sessionId)
    .sort((a, b) => a.position - b.position);
}

export function getActiveWaitlistCount(sessionId: string): number {
  return getWaitlistEntriesForSession(sessionId).filter((entry) =>
    ACTIVE_WAITLIST_STATUSES.includes(entry.status),
  ).length;
}

export function getWaitlistEntriesForParent(
  email: string,
  parentId?: string | null,
): WaitlistEntry[] {
  const normalized = email.trim().toLowerCase();
  return readAll()
    .filter(
      (entry) =>
        entry.email.trim().toLowerCase() === normalized ||
        (parentId && entry.parentId === parentId),
    )
    .sort(
      (a, b) =>
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
    );
}

export function getNextWaitlistPosition(sessionId: string): number {
  const sessionEntries = getWaitlistEntriesForSession(sessionId);
  if (sessionEntries.length === 0) {
    return 1;
  }
  return Math.max(...sessionEntries.map((entry) => entry.position)) + 1;
}

export function saveWaitlistEntry(input: NewWaitlistEntry): WaitlistEntry {
  const entries = readAll();
  const entry: WaitlistEntry = {
    ...input,
    id: crypto.randomUUID(),
    position: getNextWaitlistPosition(input.sessionId),
    joinedAt: new Date().toISOString(),
    status: "WAITLIST_PENDING",
    inviteToken: null,
    inviteExpiresAt: null,
  };

  entries.push(entry);
  writeAll(entries);
  return entry;
}

export function updateWaitlistEntry(
  id: string,
  updates: Partial<WaitlistEntry>,
): WaitlistEntry | null {
  const entries = readAll();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return null;
  }

  const next = { ...entries[index], ...updates };
  entries[index] = next;
  writeAll(entries);
  return next;
}

export function upsertWaitlistEntriesFromServer(
  serverEntries: WaitlistEntry[],
): void {
  if (!isBrowser() || serverEntries.length === 0) {
    return;
  }

  const existing = readAll();
  const byId = new Map(existing.map((entry) => [entry.id, entry]));

  for (const entry of serverEntries) {
    byId.set(entry.id, entry);
  }

  writeAll(
    [...byId.values()].sort(
      (a, b) =>
        a.sessionId.localeCompare(b.sessionId) || a.position - b.position,
    ),
  );
}

export function countEntriesByStatus(
  sessionId: string,
  status: WaitlistEntryStatus,
): number {
  return getWaitlistEntriesForSession(sessionId).filter(
    (entry) => entry.status === status,
  ).length;
}
