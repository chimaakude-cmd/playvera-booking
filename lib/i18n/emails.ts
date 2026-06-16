import { translateKey } from "./messages";
import { DEFAULT_LOCALE, type LocaleCode } from "./types";
import { buildEmailLogoHeaderHtml } from "@/lib/branding/email-header";

export type EmailStrings = {
  callbackSubject: string;
  callbackGreeting: (name: string) => string;
  callbackIntro: string;
  callbackBody: (topic: string, time: string) => string;
  callbackSupportHours: string;
  callbackUrgent: string;
  callbackSignoff: string;
  timeDuringHours: string;
  timeOn: (datetime: string) => string;
  /** HTML email wrapper with centred logo header. */
  callbackHtmlBody: (plainBody: string) => string;
};

export function getEmailStrings(locale: LocaleCode = DEFAULT_LOCALE): EmailStrings {
  const t = (key: string, params?: Record<string, string | number>) =>
    translateKey(locale, key, "emails", params);

  return {
    callbackSubject: t("callback.subject"),
    callbackGreeting: (name) => t("callback.greeting", { name }),
    callbackIntro: t("callback.intro"),
    callbackBody: (topic, time) => t("callback.body", { topic, time }),
    callbackSupportHours: t("callback.supportHours"),
    callbackUrgent: t("callback.urgent"),
    callbackSignoff: t("callback.signoff"),
    timeDuringHours: t("callback.timeDuringHours"),
    timeOn: (datetime) => t("callback.timeOn", { datetime }),
    callbackHtmlBody: (plainBody) =>
      `${buildEmailLogoHeaderHtml()}<div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;max-width:560px;margin:0 auto;">${plainBody
        .split("\n")
        .map((line) => (line ? `<p style="margin:0 0 12px 0;">${line}</p>` : ""))
        .join("")}</div>`,
  };
}
