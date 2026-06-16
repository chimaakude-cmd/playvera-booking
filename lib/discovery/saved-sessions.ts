import type { SaveListName } from "./constants";
import { SAVED_SESSIONS_KEY } from "./constants";

export type SavedSessionsStore = Record<SaveListName, string[]>;

const EMPTY_STORE: SavedSessionsStore = {
  "Summer camps": [],
  Swimming: [],
  "Birthday ideas": [],
  Favourites: [],
};

function normalizeStore(raw: unknown): SavedSessionsStore {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_STORE };
  }

  const store = { ...EMPTY_STORE };
  for (const list of Object.keys(EMPTY_STORE) as SaveListName[]) {
    const value = (raw as Record<string, unknown>)[list];
    if (Array.isArray(value)) {
      store[list] = value.filter((id): id is string => typeof id === "string");
    }
  }
  return store;
}

export function loadSavedSessions(): SavedSessionsStore {
  if (typeof window === "undefined") {
    return { ...EMPTY_STORE };
  }

  try {
    const raw = window.localStorage.getItem(SAVED_SESSIONS_KEY);
    if (!raw) {
      return { ...EMPTY_STORE };
    }
    return normalizeStore(JSON.parse(raw));
  } catch {
    return { ...EMPTY_STORE };
  }
}

export function persistSavedSessions(store: SavedSessionsStore): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(store));
}

export function isSessionSaved(
  store: SavedSessionsStore,
  sessionId: string,
): boolean {
  return Object.values(store).some((list) => list.includes(sessionId));
}

export function toggleSessionInList(
  store: SavedSessionsStore,
  sessionId: string,
  list: SaveListName,
): SavedSessionsStore {
  const next = { ...store, [list]: [...store[list]] };
  if (next[list].includes(sessionId)) {
    next[list] = next[list].filter((id) => id !== sessionId);
  } else {
    next[list] = [...next[list], sessionId];
  }
  return next;
}
