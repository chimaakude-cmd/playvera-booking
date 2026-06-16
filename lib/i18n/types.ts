export type LocaleCode = "en" | "cy" | "gd" | "sco" | "ga" | "uls";

export type FutureLocaleCode = "fr" | "es" | "nl" | "ar" | "pl";

export type Namespace =
  | "common"
  | "homepage"
  | "footer"
  | "auth"
  | "dashboard"
  | "emails";

export const NAMESPACES: Namespace[] = [
  "common",
  "homepage",
  "footer",
  "auth",
  "dashboard",
  "emails",
];

export const DEFAULT_LOCALE: LocaleCode = "en";

export type LocaleMeta = {
  code: LocaleCode;
  label: string;
  nativeLabel: string;
  region: string;
  /** BCP 47 tags used for browser detection */
  detectTags: string[];
};

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    region: "United Kingdom",
    detectTags: ["en", "en-GB", "en-US"],
  },
  {
    code: "cy",
    label: "Welsh",
    nativeLabel: "Cymraeg",
    region: "Wales",
    detectTags: ["cy", "cy-GB"],
  },
  {
    code: "gd",
    label: "Scottish Gaelic",
    nativeLabel: "Gàidhlig",
    region: "Scotland",
    detectTags: ["gd", "gd-GB"],
  },
  {
    code: "sco",
    label: "Scots",
    nativeLabel: "Scots",
    region: "Scotland",
    detectTags: ["sco"],
  },
  {
    code: "ga",
    label: "Irish",
    nativeLabel: "Gaeilge",
    region: "Ireland",
    detectTags: ["ga", "ga-IE", "ga-GB"],
  },
  {
    code: "uls",
    label: "Ulster Scots",
    nativeLabel: "Ulster Scots",
    region: "Northern Ireland",
    detectTags: ["uls"],
  },
];

export type FutureLocaleMeta = {
  code: FutureLocaleCode;
  label: string;
  nativeLabel: string;
  disabled: boolean;
};

/** Planned locales — not yet available in the language selector */
export const FUTURE_LOCALES: FutureLocaleMeta[] = [
  { code: "fr", label: "French", nativeLabel: "Français", disabled: true },
  { code: "es", label: "Spanish", nativeLabel: "Español", disabled: true },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands", disabled: true },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", disabled: true },
  { code: "pl", label: "Polish", nativeLabel: "Polski", disabled: true },
];

export type LocaleMessages = Record<string, string | Record<string, unknown>>;

export type MessagesBundle = Record<Namespace, LocaleMessages>;

export function getLocaleMeta(code: LocaleCode): LocaleMeta {
  const meta = SUPPORTED_LOCALES.find((locale) => locale.code === code);
  if (!meta) {
    return SUPPORTED_LOCALES[0];
  }
  return meta;
}

export function isLocaleCode(value: string): value is LocaleCode {
  return SUPPORTED_LOCALES.some((locale) => locale.code === value);
}
