import { DEMO_PLATFORM_STATUS, PLATFORM_STATUS_KEY } from "./defaults";
import type { PlatformStatusSnapshot } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
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
  if (!localStorage.getItem(PLATFORM_STATUS_KEY)) {
    writeJson(PLATFORM_STATUS_KEY, DEMO_PLATFORM_STATUS);
  }
}

export function getPlatformStatus(): PlatformStatusSnapshot {
  ensureSeeded();
  return readJson(PLATFORM_STATUS_KEY, DEMO_PLATFORM_STATUS);
}

export function updatePlatformStatus(
  updates: Partial<PlatformStatusSnapshot>,
): PlatformStatusSnapshot {
  ensureSeeded();
  const current = getPlatformStatus();
  const updated: PlatformStatusSnapshot = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJson(PLATFORM_STATUS_KEY, updated);
  return updated;
}
