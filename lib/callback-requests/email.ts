import {
  CALLBACK_REASON_LABELS,
  type CallbackReason,
} from "./types";
import { getEmailStrings } from "@/lib/i18n/emails";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/types";

export type ConfirmationEmailInput = {
  name: string;
  email: string;
  topic: CallbackReason;
  preferredDate: string;
  preferredTime: string;
  locale?: LocaleCode;
};

export type ConfirmationEmail = {
  to: string;
  subject: string;
  body: string;
  htmlBody: string;
  mailtoHref: string;
};

function formatPreferredTime(
  preferredDate: string,
  preferredTime: string,
  duringHoursLabel: string,
): string {
  if (preferredDate && preferredTime) {
    return `${preferredDate} at ${preferredTime}`;
  }
  if (preferredDate) {
    return preferredDate;
  }
  if (preferredTime) {
    return preferredTime;
  }
  return duringHoursLabel;
}

export function buildConfirmationEmail(
  input: ConfirmationEmailInput,
): ConfirmationEmail {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const strings = getEmailStrings(locale);
  const topicLabel = CALLBACK_REASON_LABELS[input.topic];
  const rawTime = formatPreferredTime(
    input.preferredDate,
    input.preferredTime,
    strings.timeDuringHours,
  );
  const time =
    rawTime === strings.timeDuringHours
      ? strings.timeDuringHours
      : strings.timeOn(rawTime);

  const subject = strings.callbackSubject;
  const body = [
    strings.callbackGreeting(input.name),
    "",
    strings.callbackIntro,
    "",
    strings.callbackBody(topicLabel, time),
    "",
    strings.callbackSupportHours,
    "",
    strings.callbackUrgent,
    "",
    strings.callbackSignoff,
  ].join("\n");

  const mailtoHref = `mailto:${encodeURIComponent(input.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    to: input.email,
    subject,
    body,
    htmlBody: strings.callbackHtmlBody(body),
    mailtoHref,
  };
}

/** Simulate sending confirmation email (no backend yet). */
export function sendConfirmationEmail(
  input: ConfirmationEmailInput,
): ConfirmationEmail {
  const email = buildConfirmationEmail(input);

  if (process.env.NODE_ENV === "development") {
    console.info("[Activora] Callback confirmation email template:", email);
  }

  return email;
}
