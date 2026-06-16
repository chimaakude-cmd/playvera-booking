import {
  DEFAULT_LOCALE,
  isLocaleCode,
  SUPPORTED_LOCALES,
  type LocaleCode,
} from "./types";

export const LOCALE_PREFERENCE_KEY = "activora-locale-preference";
export const LOCALE_SETTINGS_KEY = "activora-locale-settings";
export const WELCOME_DISMISS_KEY = "activora-locale-welcome-dismissed";

export type LocaleSettings = Record<LocaleCode, { enabled: boolean }>;

function defaultLocaleSettings(): LocaleSettings {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale.code, { enabled: true }]),
  ) as LocaleSettings;
}

export function getStoredLocale(): LocaleCode | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(LOCALE_PREFERENCE_KEY);
  if (stored && isLocaleCode(stored)) {
    return stored;
  }
  return null;
}

export function setStoredLocale(locale: LocaleCode): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(LOCALE_PREFERENCE_KEY, locale);
}

export function getLocaleSettings(): LocaleSettings {
  if (typeof window === "undefined") {
    return defaultLocaleSettings();
  }
  try {
    const raw = localStorage.getItem(LOCALE_SETTINGS_KEY);
    if (!raw) {
      return defaultLocaleSettings();
    }
    const parsed = JSON.parse(raw) as Partial<LocaleSettings>;
    const settings = defaultLocaleSettings();
    for (const locale of SUPPORTED_LOCALES) {
      if (parsed[locale.code]) {
        settings[locale.code] = {
          enabled:
            locale.code === "en" ? true : Boolean(parsed[locale.code]?.enabled),
        };
      }
    }
    return settings;
  } catch {
    return defaultLocaleSettings();
  }
}

export function setLocaleSettings(settings: LocaleSettings): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = { ...settings, en: { enabled: true } };
  localStorage.setItem(LOCALE_SETTINGS_KEY, JSON.stringify(normalized));
}

export function isLocaleEnabled(locale: LocaleCode): boolean {
  if (locale === "en") {
    return true;
  }
  return getLocaleSettings()[locale]?.enabled ?? false;
}

export function getEnabledLocales(): LocaleCode[] {
  const settings = getLocaleSettings();
  return SUPPORTED_LOCALES.filter((locale) => settings[locale.code]?.enabled).map(
    (locale) => locale.code,
  );
}

export function isWelcomeDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return localStorage.getItem(WELCOME_DISMISS_KEY) === "1";
}

export function dismissWelcomePrompt(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(WELCOME_DISMISS_KEY, "1");
}

export function resolveLocale(preference: LocaleCode | null): LocaleCode {
  if (!preference) {
    return DEFAULT_LOCALE;
  }
  if (!isLocaleEnabled(preference)) {
    return DEFAULT_LOCALE;
  }
  return preference;
}
