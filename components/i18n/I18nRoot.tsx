"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { LocaleWelcomePrompt } from "./LocaleWelcomePrompt";

export function I18nRoot({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <LocaleWelcomePrompt />
    </I18nProvider>
  );
}
