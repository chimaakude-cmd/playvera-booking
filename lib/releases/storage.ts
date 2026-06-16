import {
  DEFAULT_RELEASE_SETTINGS,
  RELEASE_SETTINGS_KEY,
  RELEASES_KEY,
  SEED_RELEASES,
} from "./defaults";
import type {
  CreateReleaseInput,
  Release,
  ReleaseNoteVerb,
  ReleaseSettings,
  ReleaseStatus,
  UpdateReleaseInput,
} from "./types";
import { RELEASE_NOTE_VERB_LABELS } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeded(): void {
  if (!isBrowser()) {
    return;
  }
  if (!localStorage.getItem(RELEASES_KEY)) {
    writeJson(RELEASES_KEY, SEED_RELEASES);
    writeJson(RELEASE_SETTINGS_KEY, DEFAULT_RELEASE_SETTINGS);
  }
}

export function getReleaseSettings(): ReleaseSettings {
  ensureSeeded();
  return readJson(RELEASE_SETTINGS_KEY, DEFAULT_RELEASE_SETTINGS);
}

export function updateReleaseSettings(
  updates: Partial<ReleaseSettings>,
): ReleaseSettings {
  ensureSeeded();
  const current = getReleaseSettings();
  const updated = { ...current, ...updates };
  writeJson(RELEASE_SETTINGS_KEY, updated);
  return updated;
}

export function getAllReleases(): Release[] {
  ensureSeeded();
  const releases = readJson<Release[]>(RELEASES_KEY, []);
  return [...releases].sort(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
  );
}

export function getPublishedReleases(): Release[] {
  return getAllReleases().filter((release) => release.status === "published");
}

export function getLatestPublishedReleases(limit = 3): Release[] {
  return getPublishedReleases().slice(0, limit);
}

export function getReleaseById(id: string): Release | null {
  return getAllReleases().find((release) => release.id === id) ?? null;
}

export function createRelease(input: CreateReleaseInput): Release {
  ensureSeeded();
  const releases = readJson<Release[]>(RELEASES_KEY, []);
  const now = nowIso();
  const status = input.status ?? "draft";
  const release: Release = {
    id: createId("rel"),
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type,
    version: input.version.trim(),
    releaseDate: input.releaseDate,
    summary: input.summary.trim(),
    details: input.details.map((line) => line.trim()).filter(Boolean),
    status,
    scheduledAt: input.scheduledAt ?? null,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  writeJson(RELEASES_KEY, [release, ...releases]);
  return release;
}

export function updateRelease(
  id: string,
  input: UpdateReleaseInput,
): Release | null {
  ensureSeeded();
  const releases = readJson<Release[]>(RELEASES_KEY, []);
  const index = releases.findIndex((release) => release.id === id);
  if (index === -1) {
    return null;
  }
  const current = releases[index];
  const updated: Release = {
    ...current,
    ...input,
    title: input.title?.trim() ?? current.title,
    description: input.description?.trim() ?? current.description,
    version: input.version?.trim() ?? current.version,
    summary: input.summary?.trim() ?? current.summary,
    details: input.details
      ? input.details.map((line) => line.trim()).filter(Boolean)
      : current.details,
    updatedAt: nowIso(),
  };
  releases[index] = updated;
  writeJson(RELEASES_KEY, releases);
  return updated;
}

export function publishRelease(id: string): Release | null {
  return updateRelease(id, {
    status: "published",
    publishedAt: nowIso(),
    releaseDate: nowIso(),
  });
}

export function scheduleRelease(id: string, scheduledAt: string): Release | null {
  return updateRelease(id, {
    status: "scheduled",
    scheduledAt,
    releaseDate: scheduledAt,
  });
}

export function hideRelease(id: string): Release | null {
  return updateRelease(id, { status: "hidden" });
}

export function deleteRelease(id: string): boolean {
  ensureSeeded();
  const releases = readJson<Release[]>(RELEASES_KEY, []);
  const filtered = releases.filter((release) => release.id !== id);
  if (filtered.length === releases.length) {
    return false;
  }
  writeJson(RELEASES_KEY, filtered);
  return true;
}

export function generateReleaseNoteLine(
  verb: ReleaseNoteVerb,
  text: string,
): string {
  return `${RELEASE_NOTE_VERB_LABELS[verb]}: ${text.trim()}`;
}

export function autoGenerateReleaseDetails(
  title: string,
  description: string,
  type: Release["type"],
): string[] {
  const verbMap: Record<Release["type"], ReleaseNoteVerb> = {
    feature: "added",
    improvement: "improved",
    fix: "fixed",
    security: "fixed",
    performance: "improved",
  };
  const verb = verbMap[type];
  const lines = [
    generateReleaseNoteLine(verb, title),
    generateReleaseNoteLine("improved", description),
  ];
  return lines;
}

export function getReleasesByStatus(status: ReleaseStatus): Release[] {
  return getAllReleases().filter((release) => release.status === status);
}
