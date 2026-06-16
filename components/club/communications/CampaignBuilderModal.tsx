"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Mail,
  MessageCircle,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { getDeliveryChannelsConfig } from "@/lib/club-communications/delivery-channels";
import {
  addClubCampaign,
  buildAudienceLabel,
  CAMPAIGN_TYPE_DEFINITIONS,
  createDefaultDraft,
  DEMO_CAMPAIGN_ACTIVITIES,
  DEMO_CAMPAIGN_AGE_GROUPS,
  DEMO_CAMPAIGN_VENUES,
  estimateRecipientCount,
  getCharacterLimit,
  type CampaignAudienceType,
  type CampaignBuilderDraft,
  type CampaignDeliveryChannel,
  type ClubCampaign,
} from "@/lib/club-communications/campaigns";

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

const STEPS = [
  "Audience",
  "Delivery channel",
  "Message",
  "Preview",
  "Send / Schedule",
] as const;

const AUDIENCE_ICONS: Record<CampaignAudienceType, LucideIcon> = {
  all_parents: Users,
  by_activity: Calendar,
  by_venue: Calendar,
  by_age_group: Users,
  promo_code: Mail,
  holiday_camp: Calendar,
};

type CampaignBuilderModalProps = {
  open: boolean;
  audienceType: CampaignAudienceType | null;
  canManage: boolean;
  onClose: () => void;
  onSent: (campaign: ClubCampaign) => void;
  onToast: (message: string) => void;
  onUndoStart: (campaignId: string) => void;
};

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <li
            key={label}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isActive
                ? "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/15"
                : isComplete
                  ? "bg-zinc-100 text-zinc-600"
                  : "bg-zinc-50 text-zinc-400"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                isActive
                  ? "bg-teal-600 text-white"
                  : isComplete
                    ? "bg-zinc-300 text-white"
                    : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {isComplete ? <Check className="h-2.5 w-2.5" /> : stepNumber}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function MultiSelectList({
  options,
  selected,
  onToggle,
  disabled,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked = selected.includes(option);

        return (
          <label
            key={option}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 ${
              checked
                ? "border-teal-200 bg-teal-50/50"
                : "border-zinc-200 bg-white hover:border-teal-100"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <span className="text-sm font-medium text-zinc-800">{option}</span>
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => onToggle(option)}
              className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />
          </label>
        );
      })}
    </div>
  );
}

export function CampaignBuilderModal({
  open,
  audienceType,
  canManage,
  onClose,
  onSent,
  onToast,
  onUndoStart,
}: CampaignBuilderModalProps) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CampaignBuilderDraft>(() =>
    createDefaultDraft("all_parents"),
  );
  const [errors, setErrors] = useState<string[]>([]);

  const channelsConfig = useMemo(
    () => (open ? getDeliveryChannelsConfig() : null),
    [open],
  );

  const recipientCount = useMemo(() => estimateRecipientCount(draft), [draft]);

  const characterLimit = getCharacterLimit(draft.deliveryChannel);
  const bodyLength = draft.body.length;

  useModalDismiss(open, onClose);

  useEffect(() => {
    if (open && audienceType) {
      setDraft(createDefaultDraft(audienceType));
      setStep(1);
      setErrors([]);
    }
  }, [open, audienceType]);

  if (!open || !audienceType) {
    return null;
  }

  const typeMeta = CAMPAIGN_TYPE_DEFINITIONS.find(
    (entry) => entry.id === audienceType,
  );
  const AudienceIcon = AUDIENCE_ICONS[audienceType];

  function updateDraft<K extends keyof CampaignBuilderDraft>(
    key: K,
    value: CampaignBuilderDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleSelection(
    key: "selectedActivities" | "selectedVenues" | "selectedAgeGroups",
    value: string,
  ) {
    setDraft((current) => {
      const list = current[key];
      const next = list.includes(value)
        ? list.filter((entry) => entry !== value)
        : [...list, value];

      return { ...current, [key]: next };
    });
  }

  function validateStep(currentStep: number): string[] {
    const messages: string[] = [];

    if (currentStep === 1) {
      if (
        draft.audienceType === "by_activity" &&
        draft.selectedActivities.length === 0
      ) {
        messages.push("Select at least one activity.");
      }

      if (
        draft.audienceType === "by_venue" &&
        draft.selectedVenues.length === 0
      ) {
        messages.push("Select at least one venue.");
      }

      if (
        draft.audienceType === "by_age_group" &&
        draft.selectedAgeGroups.length === 0
      ) {
        messages.push("Select at least one age group.");
      }

      if (!draft.name.trim()) {
        messages.push("Enter a campaign name.");
      }
    }

    if (currentStep === 3) {
      if (draft.deliveryChannel === "email" && !draft.subject.trim()) {
        messages.push("Enter an email subject line.");
      }

      if (!draft.body.trim()) {
        messages.push("Enter a message body.");
      }

      if (bodyLength > characterLimit) {
        messages.push(
          `Message exceeds the ${characterLimit}-character limit for ${draft.deliveryChannel.toUpperCase()}.`,
        );
      }
    }

    if (currentStep === 5 && draft.sendMode === "schedule") {
      if (!draft.scheduledAt) {
        messages.push("Choose a schedule date.");
      }
    }

    return messages;
  }

  function handleNext() {
    const stepErrors = validateStep(step);

    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors([]);
    setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function handleBack() {
    setErrors([]);
    setStep((current) => Math.max(current - 1, 1));
  }

  function handleTestSend() {
    onToast("Demo: test email sent to your club account");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const stepErrors = validateStep(5);

    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    const campaign = addClubCampaign(draft);
    onSent(campaign);

    if (draft.sendMode === "now") {
      onToast(
        `Campaign sent to ${recipientCount.toLocaleString()} parents via email`,
      );
      onUndoStart(campaign.id);
    } else {
      onToast(`Campaign scheduled for ${draft.scheduledAt}`);
    }

    onClose();
  }

  function renderAudienceStep() {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 ring-1 ring-inset ring-teal-600/15">
            <AudienceIcon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {typeMeta?.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              {typeMeta?.description}
            </p>
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-800">
            Campaign name
          </span>
          <input
            value={draft.name}
            disabled={!canManage}
            onChange={(event) => updateDraft("name", event.target.value)}
            className={inputClassName}
            placeholder="e.g. Summer term update"
          />
        </label>

        {draft.audienceType === "all_parents" ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm leading-6 text-zinc-600">
            Every parent with an active or previous booking will be included.
            Unsubscribed contacts are excluded when the preference toggle is on.
          </p>
        ) : null}

        {draft.audienceType === "by_activity" ? (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">
              Select activities
            </p>
            <MultiSelectList
              options={DEMO_CAMPAIGN_ACTIVITIES}
              selected={draft.selectedActivities}
              disabled={!canManage}
              onToggle={(value) =>
                toggleSelection("selectedActivities", value)
              }
            />
          </div>
        ) : null}

        {draft.audienceType === "by_venue" ? (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">
              Choose venues
            </p>
            <MultiSelectList
              options={DEMO_CAMPAIGN_VENUES}
              selected={draft.selectedVenues}
              disabled={!canManage}
              onToggle={(value) => toggleSelection("selectedVenues", value)}
            />
          </div>
        ) : null}

        {draft.audienceType === "by_age_group" ? (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">
              Choose age groups
            </p>
            <MultiSelectList
              options={DEMO_CAMPAIGN_AGE_GROUPS}
              selected={draft.selectedAgeGroups}
              disabled={!canManage}
              onToggle={(value) => toggleSelection("selectedAgeGroups", value)}
            />
          </div>
        ) : null}

        {draft.audienceType === "promo_code" ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm leading-6 text-zinc-600">
            Parents who opted in to promotional offers and have an active booking
            profile will receive this campaign.
          </p>
        ) : null}

        {draft.audienceType === "holiday_camp" ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm leading-6 text-zinc-600">
            Families with past holiday camp or multi-day bookings are targeted
            automatically.
          </p>
        ) : null}

        <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Estimated recipients
          </p>
          <p className="mt-1 text-2xl font-semibold text-teal-900">
            {recipientCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-teal-800/80">
            Demo count — actual delivery depends on live booking data.
          </p>
        </div>
      </div>
    );
  }

  function renderChannelStep() {
    const smsConnected = channelsConfig?.sms.connected ?? false;
    const whatsappConnected = channelsConfig?.whatsapp.connected ?? false;

    const channels: Array<{
      id: CampaignDeliveryChannel;
      label: string;
      description: string;
      icon: LucideIcon;
      disabled: boolean;
      disabledReason?: string;
    }> = [
      {
        id: "email",
        label: "Email",
        description: "Recommended for campaigns and longer content.",
        icon: Mail,
        disabled: false,
      },
      {
        id: "sms",
        label: "SMS",
        description: "Short updates for time-sensitive offers.",
        icon: Smartphone,
        disabled: !smsConnected,
        disabledReason: "Connect SMS in Delivery channels first.",
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        description: "Reach parents on WhatsApp Business.",
        icon: MessageCircle,
        disabled: !whatsappConnected,
        disabledReason: "Connect WhatsApp in Delivery channels first.",
      },
    ];

    return (
      <div className="space-y-3">
        <p className="text-sm leading-6 text-zinc-500">
          Email is live. SMS and WhatsApp unlock once connected under Delivery
          channels.
        </p>

        {channels.map((channel) => {
          const Icon = channel.icon;
          const selected = draft.deliveryChannel === channel.id;

          return (
            <label
              key={channel.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                channel.disabled
                  ? "cursor-not-allowed border-zinc-100 bg-zinc-50/80 opacity-70"
                  : selected
                    ? "border-teal-200 bg-teal-50/40"
                    : "border-zinc-200 bg-white hover:border-teal-100"
              }`}
              title={channel.disabled ? channel.disabledReason : undefined}
            >
              <input
                type="radio"
                name="deliveryChannel"
                value={channel.id}
                checked={selected}
                disabled={!canManage || channel.disabled}
                onChange={() => updateDraft("deliveryChannel", channel.id)}
                className="mt-1 h-4 w-4 border-zinc-300 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/15">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {channel.label}
                    {channel.id === "email" ? (
                      <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-600/15">
                        Live
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {channel.description}
                  </p>
                  {channel.disabled ? (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      {channel.disabledReason}
                    </p>
                  ) : null}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    );
  }

  function renderMessageStep() {
    return (
      <div className="space-y-5">
        {draft.deliveryChannel === "email" ? (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Subject
            </span>
            <input
              value={draft.subject}
              disabled={!canManage}
              onChange={(event) => updateDraft("subject", event.target.value)}
              className={inputClassName}
              placeholder="e.g. Summer camp places now open"
            />
          </label>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1.5 flex items-center justify-between font-medium text-zinc-800">
            <span>Message</span>
            <span
              className={`text-xs font-normal ${
                bodyLength > characterLimit ? "text-rose-600" : "text-zinc-400"
              }`}
            >
              {bodyLength.toLocaleString()} / {characterLimit.toLocaleString()}
            </span>
          </span>
          <textarea
            value={draft.body}
            disabled={!canManage}
            onChange={(event) => updateDraft("body", event.target.value)}
            rows={8}
            className={`${inputClassName} resize-y`}
            placeholder="Write your campaign message..."
          />
        </label>

        <label className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm">
          <span>
            <span className="block font-medium text-zinc-800">
              Respect unsubscribe preferences
            </span>
            <span className="text-zinc-500">
              Parents who opted out of marketing will be excluded automatically.
            </span>
          </span>
          <input
            type="checkbox"
            checked={draft.respectUnsubscribe}
            disabled={!canManage}
            onChange={(event) =>
              updateDraft("respectUnsubscribe", event.target.checked)
            }
            className="mt-1 h-5 w-5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
          />
        </label>

        <button
          type="button"
          disabled={!canManage || !draft.body.trim()}
          onClick={handleTestSend}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-teal-200 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Test send to yourself
        </button>
      </div>
    );
  }

  function renderPreviewStep() {
    const audience = buildAudienceLabel(draft);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Campaign
              </dt>
              <dd className="mt-0.5 font-medium text-zinc-900">{draft.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Audience
              </dt>
              <dd className="mt-0.5 text-zinc-700">{audience}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Channel
              </dt>
              <dd className="mt-0.5 capitalize text-zinc-700">
                {draft.deliveryChannel}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Recipients
              </dt>
              <dd className="mt-0.5 text-zinc-700">
                {recipientCount.toLocaleString()} parents
                {draft.respectUnsubscribe ? " (unsubscribes excluded)" : ""}
              </dd>
            </div>
          </dl>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 bg-gradient-to-r from-teal-50/80 to-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Message preview
            </p>
            {draft.deliveryChannel === "email" && draft.subject ? (
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {draft.subject}
              </p>
            ) : null}
          </div>
          <div className="px-4 py-4 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">
            {draft.body || "No message content yet."}
          </div>
        </div>
      </div>
    );
  }

  function renderSendStep() {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Ready to send
          </p>
          <p className="mt-1 text-sm text-teal-900">
            {recipientCount.toLocaleString()} parents will receive this campaign
            via {draft.deliveryChannel}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-xl border p-4 ${
              draft.sendMode === "now"
                ? "border-teal-200 bg-teal-50/40"
                : "border-zinc-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="sendMode"
              checked={draft.sendMode === "now"}
              disabled={!canManage}
              onChange={() => updateDraft("sendMode", "now")}
              className="mr-2 h-4 w-4 border-zinc-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-semibold text-zinc-900">
              Send now
            </span>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Deliver immediately. You can undo for 60 seconds after sending.
            </p>
          </label>

          <label
            className={`cursor-pointer rounded-xl border p-4 ${
              draft.sendMode === "schedule"
                ? "border-teal-200 bg-teal-50/40"
                : "border-zinc-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="sendMode"
              checked={draft.sendMode === "schedule"}
              disabled={!canManage}
              onChange={() => updateDraft("sendMode", "schedule")}
              className="mr-2 h-4 w-4 border-zinc-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-semibold text-zinc-900">
              Schedule
            </span>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Pick a future date to send automatically.
            </p>
          </label>
        </div>

        {draft.sendMode === "schedule" ? (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Schedule date
            </span>
            <input
              type="date"
              value={draft.scheduledAt}
              disabled={!canManage}
              onChange={(event) =>
                updateDraft("scheduledAt", event.target.value)
              }
              className={inputClassName}
            />
          </label>
        ) : null}

        <p className="text-xs leading-5 text-zinc-500">
          Email-only sending is enabled in this demo. SMS and WhatsApp will
          follow once those channels are connected.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close campaign builder"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl"
      >
        <div className="border-b border-zinc-100 bg-gradient-to-r from-teal-50/80 to-white px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            {typeMeta?.buttonLabel ?? "Create campaign"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Step {step} of {STEPS.length} — {STEPS[step - 1]}
          </p>
          <div className="mt-4">
            <StepIndicator currentStep={step} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {errors.length > 0 ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <ul className="list-disc space-y-1 pl-4">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === 1 ? renderAudienceStep() : null}
          {step === 2 ? renderChannelStep() : null}
          {step === 3 ? renderMessageStep() : null}
          {step === 4 ? renderPreviewStep() : null}
          {step === 5 ? renderSendStep() : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>

          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700"
            >
              Back
            </button>
          ) : null}

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canManage}
              className="ml-auto rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {draft.sendMode === "now" ? "Send campaign" : "Schedule campaign"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
