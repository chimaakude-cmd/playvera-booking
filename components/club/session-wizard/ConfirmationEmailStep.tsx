"use client";

import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/branding";
import { WizardFormData } from "@/lib/session-wizard";
import {
  ImageUploadPlaceholder,
  StepSection,
  WizardField,
  wizardInputClassName,
  wizardTextareaClassName,
} from "./shared";

type ConfirmationEmailStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

export function ConfirmationEmailStep({
  data,
  onChange,
}: ConfirmationEmailStepProps) {
  function updateConfirmationEmail(
    updates: Partial<WizardFormData["confirmationEmail"]>,
  ) {
    onChange({
      confirmationEmail: {
        ...data.confirmationEmail,
        ...updates,
      },
    });
  }

  return (
    <StepSection
      title="Parent confirmation email"
      description="Set the content parents will receive after booking. Email sending is not live yet."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-5">
          <WizardField
            label="Confirmation email image"
            htmlFor="confirmation-image"
            hint="Placeholder only — real uploads will be enabled later."
          >
            <ImageUploadPlaceholder
              label={
                data.confirmationEmail.imagePlaceholder
                  ? "Confirmation image selected"
                  : "Add confirmation image"
              }
              selected={Boolean(data.confirmationEmail.imagePlaceholder)}
              onSelect={() =>
                updateConfirmationEmail({
                  imagePlaceholder: "confirmation-email-image",
                })
              }
            />
          </WizardField>

          <WizardField label="Welcome message" htmlFor="welcome-message">
            <textarea
              id="welcome-message"
              value={data.confirmationEmail.welcomeMessage}
              onChange={(event) =>
                updateConfirmationEmail({ welcomeMessage: event.target.value })
              }
              placeholder="Thank you for booking with us! We're looking forward to welcoming your child."
              className={wizardTextareaClassName}
            />
          </WizardField>

          <WizardField
            label="Extra information / reminders"
            htmlFor="extra-information"
          >
            <textarea
              id="extra-information"
              value={data.confirmationEmail.extraInformation}
              onChange={(event) =>
                updateConfirmationEmail({ extraInformation: event.target.value })
              }
              placeholder="Arrival time, what to wear, pickup instructions, and any reminders."
              className={wizardTextareaClassName}
            />
          </WizardField>

          <div className="grid gap-4 sm:grid-cols-2">
            <WizardField
              label="Club contact details (optional)"
              htmlFor="club-contact"
            >
              <textarea
                id="club-contact"
                value={data.confirmationEmail.clubContactDetails ?? ""}
                onChange={(event) =>
                  updateConfirmationEmail({
                    clubContactDetails: event.target.value,
                  })
                }
                placeholder="Phone number, website, or office hours"
                className={wizardTextareaClassName}
              />
            </WizardField>

            <WizardField label="Reply-to email (optional)" htmlFor="reply-to">
              <input
                id="reply-to"
                type="email"
                value={data.confirmationEmail.replyToEmail ?? ""}
                onChange={(event) =>
                  updateConfirmationEmail({ replyToEmail: event.target.value })
                }
                placeholder="bookings@yourclub.com"
                className={wizardInputClassName}
              />
            </WizardField>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
            Live preview
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-4 py-4">
              <div className="flex justify-center">
                <Logo size={36} href={null} />
              </div>
              <p className="mt-2 text-center text-xs font-semibold text-zinc-500">
                {BRAND_NAME} booking confirmation
              </p>
            </div>
            <div className="p-5">
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                {data.confirmationEmail.imagePlaceholder
                  ? "Confirmation image placeholder"
                  : "Add a confirmation image"}
              </div>
              <p className="mt-4 text-sm font-semibold text-zinc-900">
                {data.sessionTitle || "Session name"}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {data.confirmationEmail.welcomeMessage ||
                  "Your welcome message will appear here."}
              </p>
              <div className="mt-4 rounded-xl bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Reminders
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {data.confirmationEmail.extraInformation ||
                    "Extra information and reminders will appear here."}
                </p>
              </div>
              {data.confirmationEmail.clubContactDetails ? (
                <p className="mt-4 text-sm text-zinc-600">
                  <strong>Contact:</strong>{" "}
                  {data.confirmationEmail.clubContactDetails}
                </p>
              ) : null}
              {data.confirmationEmail.replyToEmail ? (
                <p className="mt-2 text-sm text-zinc-600">
                  <strong>Reply to:</strong> {data.confirmationEmail.replyToEmail}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </StepSection>
  );
}
