import { DEFAULT_WIDGET_SETTINGS } from "./defaults";
import type { ClubWidgetSettings } from "./types";

export const WIDGET_STORAGE_KEY = "activora-club-widget";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getWidgetSettings(): ClubWidgetSettings {
  if (!isBrowser()) {
    return { ...DEFAULT_WIDGET_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) {
      const initial = { ...DEFAULT_WIDGET_SETTINGS };
      localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    return { ...DEFAULT_WIDGET_SETTINGS, ...JSON.parse(raw) } as ClubWidgetSettings;
  } catch {
    return { ...DEFAULT_WIDGET_SETTINGS };
  }
}

export function saveWidgetSettings(settings: ClubWidgetSettings): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(settings));
}

export function getWidgetSettingsForProvider(
  providerId: string,
): ClubWidgetSettings {
  const settings = getWidgetSettings();
  if (settings.providerId === providerId) {
    return settings;
  }

  return { ...DEFAULT_WIDGET_SETTINGS, providerId };
}
