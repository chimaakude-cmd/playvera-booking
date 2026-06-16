import {
  flattenMessages,
  getAllEnglishKeys,
  MESSAGES,
} from "./messages";
import {
  DEFAULT_LOCALE,
  NAMESPACES,
  SUPPORTED_LOCALES,
  type LocaleCode,
  type Namespace,
} from "./types";

export type NamespaceCompletion = {
  namespace: Namespace;
  totalKeys: number;
  translatedKeys: number;
  percent: number;
  missingKeys: string[];
};

export type LocaleCompletion = {
  locale: LocaleCode;
  label: string;
  nativeLabel: string;
  totalKeys: number;
  translatedKeys: number;
  percent: number;
  namespaces: NamespaceCompletion[];
  missingKeys: string[];
};

export function getNamespaceCompletion(
  locale: LocaleCode,
  namespace: Namespace,
  englishKeys: Record<string, string>,
): NamespaceCompletion {
  const localeFlat = flattenMessages(
    MESSAGES[locale][namespace] as Record<string, unknown>,
  );
  const missingKeys: string[] = [];
  let translatedKeys = 0;

  for (const key of Object.keys(englishKeys)) {
    if (localeFlat[key] && localeFlat[key].trim().length > 0) {
      translatedKeys += 1;
    } else {
      missingKeys.push(key);
    }
  }

  const totalKeys = Object.keys(englishKeys).length;
  const percent =
    totalKeys === 0 ? 100 : Math.round((translatedKeys / totalKeys) * 100);

  return {
    namespace,
    totalKeys,
    translatedKeys,
    percent,
    missingKeys,
  };
}

export function getLocaleCompletion(locale: LocaleCode): LocaleCompletion {
  const englishByNs = getAllEnglishKeys();
  const meta = SUPPORTED_LOCALES.find((item) => item.code === locale)!;
  const namespaces = NAMESPACES.map((namespace) =>
    getNamespaceCompletion(locale, namespace, englishByNs[namespace]),
  );

  const totalKeys = namespaces.reduce((sum, ns) => sum + ns.totalKeys, 0);
  const translatedKeys = namespaces.reduce(
    (sum, ns) => sum + ns.translatedKeys,
    0,
  );
  const missingKeys = namespaces.flatMap((ns) =>
    ns.missingKeys.map((key) => `${ns.namespace}.${key}`),
  );

  return {
    locale,
    label: meta.label,
    nativeLabel: meta.nativeLabel,
    totalKeys,
    translatedKeys,
    percent:
      totalKeys === 0 ? 100 : Math.round((translatedKeys / totalKeys) * 100),
    namespaces,
    missingKeys,
  };
}

export function getAllLocaleCompletions(): LocaleCompletion[] {
  return SUPPORTED_LOCALES.filter((locale) => locale.code !== DEFAULT_LOCALE).map(
    (locale) => getLocaleCompletion(locale.code),
  );
}
