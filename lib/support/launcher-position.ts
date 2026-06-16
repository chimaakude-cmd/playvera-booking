export const SUPPORT_LAUNCHER_POSITION_KEY = "activora-support-launcher-position";
export const LAUNCHER_RESET_EVENT = "activora-support-launcher-reset";

/** Matches Tailwind `bottom-5` / `right-5` (1.25rem). */
export const DEFAULT_LAUNCHER_OFFSET = 20;
/** Extra bottom clearance on pages with dense bottom controls (e.g. widget builder). */
export const COMPACT_LAUNCHER_BOTTOM_BOOST = 72;
export const LAUNCHER_EDGE_PADDING = 16;
export const LAUNCHER_DRAG_THRESHOLD = 8;

export type LauncherPosition = { x: number; y: number };

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readLauncherPosition(): LauncherPosition | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(SUPPORT_LAUNCHER_POSITION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as LauncherPosition;
    if (
      typeof parsed?.x === "number" &&
      typeof parsed?.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLauncherPosition(position: LauncherPosition): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(SUPPORT_LAUNCHER_POSITION_KEY, JSON.stringify(position));
}

export function clearLauncherPosition(): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.removeItem(SUPPORT_LAUNCHER_POSITION_KEY);
}

export function resetLauncherPosition(): void {
  clearLauncherPosition();
  window.dispatchEvent(new Event(LAUNCHER_RESET_EVENT));
}
