import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type LocaleCode } from "./types";
import { isLocaleEnabled } from "./storage";

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

/**
 * Detect a supported UK locale from browser language preferences.
 * Returns null if no match — caller should not auto-switch.
 */
export function detectBrowserLocale(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? navigator.languages
    : [],
): LocaleCode | null {
  if (languages.length === 0 && typeof navigator !== "undefined") {
    languages = [navigator.language];
  }

  for (const raw of languages) {
    const tag = normalizeTag(raw);
    if (tag.startsWith("en")) {
      continue;
    }

    for (const locale of SUPPORTED_LOCALES) {
      if (locale.code === "en") {
        continue;
      }
      const matches = locale.detectTags.some(
        (detectTag) =>
          tag === normalizeTag(detectTag) ||
          tag.startsWith(`${normalizeTag(detectTag)}-`),
      );
      if (matches && isLocaleEnabled(locale.code)) {
        return locale.code;
      }
    }
  }

  return null;
}

export function getWelcomePromptLocale(): LocaleCode | null {
  const detected = detectBrowserLocale();
  if (!detected || detected === DEFAULT_LOCALE) {
    return null;
  }
  return detected;
}
