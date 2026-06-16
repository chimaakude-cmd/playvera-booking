"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredLocale,
  resolveLocale,
  setStoredLocale,
} from "./storage";
import { translateKey } from "./messages";
import {
  DEFAULT_LOCALE,
  getLocaleMeta,
  type LocaleCode,
  type Namespace,
} from "./types";

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, namespace?: Namespace, params?: TranslateParams) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(resolveLocale(stored));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const setLocale = useCallback((next: LocaleCode) => {
    const resolved = resolveLocale(next);
    setStoredLocale(resolved);
    setLocaleState(resolved);
  }, []);

  const t = useCallback(
    (key: string, namespace: Namespace = "common", params?: TranslateParams) =>
      translateKey(locale, key, namespace, params),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      ready,
    }),
    [locale, setLocale, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function useTranslation(namespace: Namespace = "common") {
  const { locale, setLocale, t: translate, ready } = useI18n();
  const meta = getLocaleMeta(locale);

  const t = useCallback(
    (key: string, params?: TranslateParams) => translate(key, namespace, params),
    [translate, namespace],
  );

  return {
    locale,
    localeMeta: meta,
    setLocale,
    t,
    ready,
  };
}
