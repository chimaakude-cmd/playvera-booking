"use client";

import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/branding";
import { loadClubProfile } from "@/lib/club/new-club-mode";
import { WizardFormData } from "@/lib/session-wizard";
import { MainImageUpload } from "./MainImageUpload";
import { SafeImage } from "@/components/ui/SafeImage";
import { resolveImagePreviewUrl } from "@/lib/session-images";
import {
  getSupabaseStorageSetupMessage,
  shouldShowStorageSetupNotice,
} from "@/lib/image-storage";
import {
  StepSection,
  WizardField,
  wizardInputClassName,
  wizardTextareaClassName,
} from "./shared";

const PROFILE_EDIT_HREF = "/club/settings/profile/edit";

type ConfirmationEmailStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

export function ConfirmationEmailStep({
  data,
  onChange,
}: ConfirmationEmailStepProps) {
  const profile = loadClubProfile();
  const clubPhone = profile.contact.phone.trim();
  const clubEmail = profile.contact.email.trim();
  const contactComplete = Boolean(clubPhone && clubEmail);
  const imagePreviewUrl = resolveImagePreviewUrl(
    data.confirmationEmail.confirmationImage,
  );

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
      description="Set the content parents will receive after booking."
    >
      {!contactComplete ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            Please complete your club profile contact details before publishing
            this session.
          </p>
          <Link
            href={PROFILE_EDIT_HREF}
            className="mt-2 inline-block font-medium text-amber-950 underline underline-offset-2"
          >
            Update club profile contact details
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-5">
          <WizardField
            label="Confirmation email image"
            htmlFor="confirmation-image"
            hint="Required. JPG, PNG, or WebP up to 10MB."
          >
            {shouldShowStorageSetupNotice() ? (
              <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                {getSupabaseStorageSetupMessage()} Images will be saved locally in
                your browser until Storage is ready.
              </p>
            ) : null}
            <MainImageUpload
              imageId={data.confirmationEmail.confirmationImage}
              onChange={(confirmationImage) =>
                updateConfirmationEmail({ confirmationImage })
              }
            />
          </WizardField>

          <WizardField
            label="Welcome message"
            htmlFor="welcome-message"
            hint="Required."
          >
            <textarea
              id="welcome-message"
              required
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
            hint="Required."
          >
            <textarea
              id="extra-information"
              required
              value={data.confirmationEmail.extraInformation}
              onChange={(event) =>
                updateConfirmationEmail({ extraInformation: event.target.value })
              }
              placeholder="Arrival time, what to wear, pickup instructions, and any reminders."
              className={wizardTextareaClassName}
            />
          </WizardField>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
            <p className="text-sm font-semibold text-zinc-900">
              Club contact details
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Pulled from your verified club profile. Update them in profile
              settings if they need changing.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <WizardField label="Club phone number" htmlFor="club-phone-readonly">
                <input
                  id="club-phone-readonly"
                  type="text"
                  readOnly
                  value={clubPhone || "Not set"}
                  className={`${wizardInputClassName} cursor-not-allowed bg-zinc-100 text-zinc-600`}
                />
              </WizardField>
              <WizardField
                label="Club email address"
                htmlFor="club-email-readonly"
              >
                <input
                  id="club-email-readonly"
                  type="email"
                  readOnly
                  value={clubEmail || "Not set"}
                  className={`${wizardInputClassName} cursor-not-allowed bg-zinc-100 text-zinc-600`}
                />
              </WizardField>
            </div>
            <Link
              href={PROFILE_EDIT_HREF}
              className="mt-3 inline-block text-xs font-medium text-pink-700 underline underline-offset-2"
            >
              Edit in club profile settings
            </Link>
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
              {imagePreviewUrl ? (
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <SafeImage
                    src={imagePreviewUrl}
                    alt="Confirmation email preview"
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                  Add a confirmation image
                </div>
              )}
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
              {clubPhone || clubEmail ? (
                <div className="mt-4 space-y-1 text-sm text-zinc-600">
                  {clubPhone ? (
                    <p>
                      <strong>Phone:</strong> {clubPhone}
                    </p>
                  ) : null}
                  {clubEmail ? (
                    <p>
                      <strong>Email:</strong> {clubEmail}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </StepSection>
  );
}
