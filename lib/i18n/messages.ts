import type { LocaleCode, MessagesBundle, Namespace } from "./types";
import { DEFAULT_LOCALE, NAMESPACES } from "./types";

import enCommon from "@/locales/en/common.json";
import enHomepage from "@/locales/en/homepage.json";
import enFooter from "@/locales/en/footer.json";
import enAuth from "@/locales/en/auth.json";
import enDashboard from "@/locales/en/dashboard.json";
import enEmails from "@/locales/en/emails.json";

import cyCommon from "@/locales/cy/common.json";
import cyHomepage from "@/locales/cy/homepage.json";
import cyFooter from "@/locales/cy/footer.json";
import cyAuth from "@/locales/cy/auth.json";
import cyDashboard from "@/locales/cy/dashboard.json";
import cyEmails from "@/locales/cy/emails.json";

import gdCommon from "@/locales/gd/common.json";
import gdHomepage from "@/locales/gd/homepage.json";
import gdFooter from "@/locales/gd/footer.json";
import gdAuth from "@/locales/gd/auth.json";
import gdDashboard from "@/locales/gd/dashboard.json";
import gdEmails from "@/locales/gd/emails.json";

import scoCommon from "@/locales/sco/common.json";
import scoHomepage from "@/locales/sco/homepage.json";
import scoFooter from "@/locales/sco/footer.json";
import scoAuth from "@/locales/sco/auth.json";
import scoDashboard from "@/locales/sco/dashboard.json";
import scoEmails from "@/locales/sco/emails.json";

import gaCommon from "@/locales/ga/common.json";
import gaHomepage from "@/locales/ga/homepage.json";
import gaFooter from "@/locales/ga/footer.json";
import gaAuth from "@/locales/ga/auth.json";
import gaDashboard from "@/locales/ga/dashboard.json";
import gaEmails from "@/locales/ga/emails.json";

import ulsCommon from "@/locales/uls/common.json";
import ulsHomepage from "@/locales/uls/homepage.json";
import ulsFooter from "@/locales/uls/footer.json";
import ulsAuth from "@/locales/uls/auth.json";
import ulsDashboard from "@/locales/uls/dashboard.json";
import ulsEmails from "@/locales/uls/emails.json";

const MESSAGES: Record<LocaleCode, MessagesBundle> = {
  en: {
    common: enCommon,
    homepage: enHomepage,
    footer: enFooter,
    auth: enAuth,
    dashboard: enDashboard,
    emails: enEmails,
  },
  cy: {
    common: cyCommon,
    homepage: cyHomepage,
    footer: cyFooter,
    auth: cyAuth,
    dashboard: cyDashboard,
    emails: cyEmails,
  },
  gd: {
    common: gdCommon,
    homepage: gdHomepage,
    footer: gdFooter,
    auth: gdAuth,
    dashboard: gdDashboard,
    emails: gdEmails,
  },
  sco: {
    common: scoCommon,
    homepage: scoHomepage,
    footer: scoFooter,
    auth: scoAuth,
    dashboard: scoDashboard,
    emails: scoEmails,
  },
  ga: {
    common: gaCommon,
    homepage: gaHomepage,
    footer: gaFooter,
    auth: gaAuth,
    dashboard: gaDashboard,
    emails: gaEmails,
  },
  uls: {
    common: ulsCommon,
    homepage: ulsHomepage,
    footer: ulsFooter,
    auth: ulsAuth,
    dashboard: ulsDashboard,
    emails: ulsEmails,
  },
};

export function getMessages(locale: LocaleCode): MessagesBundle {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
}

export function getMessageValue(
  bundle: MessagesBundle,
  namespace: Namespace,
  key: string,
): string | undefined {
  const parts = key.split(".");
  let current: unknown = bundle[namespace];

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function translateKey(
  locale: LocaleCode,
  key: string,
  namespace: Namespace = "common",
  params?: Record<string, string | number>,
): string {
  const bundle = getMessages(locale);
  const fallbackBundle = getMessages(DEFAULT_LOCALE);

  let value =
    getMessageValue(bundle, namespace, key) ??
    getMessageValue(fallbackBundle, namespace, key) ??
    key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replace(
        new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
        String(paramValue),
      );
    }
  }

  return value;
}

export function flattenMessages(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[path] = value;
    } else if (value && typeof value === "object") {
      Object.assign(
        result,
        flattenMessages(value as Record<string, unknown>, path),
      );
    }
  }

  return result;
}

export function getAllEnglishKeys(): Record<Namespace, Record<string, string>> {
  const en = MESSAGES.en;
  return Object.fromEntries(
    NAMESPACES.map((ns) => [ns, flattenMessages(en[ns] as Record<string, unknown>)]),
  ) as Record<Namespace, Record<string, string>>;
}

export { MESSAGES, NAMESPACES };
