"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Globe,
  Megaphone,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import {
  AUTOMATED_TEMPLATE_LABELS,
  getDeliveryChannelsConfig,
  getPushNotificationsInterest,
  getSmsProviderLabel,
  getWhatsAppProviderLabel,
  getWhatsAppTemplateStatusLabel,
  PUSH_FEATURE_DEFINITIONS,
  PUSH_FUTURE_PROVIDERS,
  PUSH_ROLLOUT,
  PUSH_STRATEGY_DEFINITIONS,
  saveDeliveryChannelsConfig,
  savePushNotificationsInterest,
  SMS_PROVIDER_OPTIONS,
  WHATSAPP_PROVIDER_OPTIONS,
  WHATSAPP_TEMPLATE_STATUS_OPTIONS,
  type AutomatedTemplateKey,
  type ChannelStatus,
  type DeliveryChannelsConfig,
  type PushFeatureDefinition,
  type SmsChannelConfig,
  type WhatsAppChannelConfig,
} from "@/lib/club-communications/delivery-channels";

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

type DeliveryChannelsSectionProps = {
  canEdit?: boolean;
};

type SetupModal = "sms" | "whatsapp" | null;

const CHANNEL_DEFINITIONS = [
  {
    id: "email",
    label: "Email",
    description: "Transactional emails for bookings, reminders, and reviews.",
    status: "live" as ChannelStatus,
  },
  {
    id: "sms",
    label: "SMS",
    description: "Text parents for time-sensitive booking updates.",
    status: "setup_required" as ChannelStatus,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Reach parents on WhatsApp Business with approved templates.",
    status: "setup_required" as ChannelStatus,
  },
  {
    id: "push",
    label: "Push notifications",
    description:
      "Send real-time updates directly to parents once mobile app and browser notifications launch.",
    status: "future" as ChannelStatus,
  },
] as const;

const PUSH_FEATURE_ICONS: Record<string, LucideIcon> = {
  mobile: Smartphone,
  browser: Globe,
};

const PUSH_STRATEGY_ICONS: Record<string, LucideIcon> = {
  urgent: Bell,
  reminder: Bell,
  marketing: Megaphone,
};

const STATUS_STYLES: Record<
  ChannelStatus,
  { badge: string; label: string }
> = {
  live: {
    badge: "bg-teal-50 text-teal-700 ring-teal-500/20",
    label: "Live",
  },
  setup_required: {
    badge: "bg-amber-50 text-amber-800 ring-amber-500/20",
    label: "Setup required",
  },
  future: {
    badge: "bg-zinc-100 text-zinc-600 ring-zinc-500/10",
    label: "Future",
  },
};

function StatusBadge({ status }: { status: ChannelStatus }) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${styles.badge}`}
    >
      {styles.label}
    </span>
  );
}

function RolloutBadge() {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-200">
        Planned · {PUSH_ROLLOUT.phase}
      </span>
      <span className="text-[10px] text-zinc-400">
        Estimated: {PUSH_ROLLOUT.estimate}
      </span>
    </div>
  );
}

type PushFeatureCardProps = {
  feature: PushFeatureDefinition;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
};

function PushFeatureCard({
  feature,
  icon: Icon,
  expanded,
  onToggle,
}: PushFeatureCardProps) {
  const panelId = `push-feature-${feature.id}`;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white/80">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-start gap-2.5 p-3 text-left transition-colors hover:bg-zinc-50/80"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/15">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <h4 className="text-sm font-semibold text-zinc-900">
              {feature.title}
            </h4>
            <RolloutBadge />
          </div>
          <p className="mt-1 text-[11px] leading-4 text-zinc-500">
            {feature.notifications.slice(0, 2).join(", ")}
            {feature.notifications.length > 2 ? " + more" : ""}
          </p>
        </div>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div
          id={panelId}
          className="space-y-2.5 border-t border-zinc-100 bg-zinc-50/50 px-3 py-2.5"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              What notifications
            </p>
            <p className="mt-0.5 text-xs leading-4 text-zinc-600">
              {feature.notifications.join(", ")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Example timing
            </p>
            <ul className="mt-0.5 space-y-0.5">
              {feature.exampleTiming.map((item) => (
                <li key={item} className="text-xs leading-4 text-zinc-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Benefits
            </p>
            <ul className="mt-0.5 space-y-0.5">
              {feature.benefits.map((item) => (
                <li key={item} className="text-xs leading-4 text-zinc-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type PushNotificationsCardProps = {
  onRegisterInterest: () => void;
  interestRegistered: boolean;
};

function PushNotificationsCard({
  onRegisterInterest,
  interestRegistered,
}: PushNotificationsCardProps) {
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(
    null,
  );

  function toggleFeature(id: string) {
    setExpandedFeatureId((current) => (current === id ? null : id));
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {PUSH_FEATURE_DEFINITIONS.map((feature) => (
          <PushFeatureCard
            key={feature.id}
            feature={feature}
            icon={PUSH_FEATURE_ICONS[feature.id] ?? Bell}
            expanded={expandedFeatureId === feature.id}
            onToggle={() => toggleFeature(feature.id)}
          />
        ))}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-zinc-900">
          Notification strategy
        </h4>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Default recommendation by message type
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {PUSH_STRATEGY_DEFINITIONS.map((strategy) => {
            const StrategyIcon = PUSH_STRATEGY_ICONS[strategy.id] ?? Bell;

            return (
              <div
                key={strategy.id}
                className="rounded-xl border border-zinc-100 bg-white/80 p-2.5"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm leading-none" aria-hidden>
                    {strategy.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-zinc-900">
                        {strategy.label}
                      </p>
                      <StrategyIcon
                        className="h-3 w-3 shrink-0 text-teal-600/70"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                      {strategy.examples.join(", ")}
                    </p>
                    <p className="mt-1.5 text-[10px] font-medium text-teal-700">
                      Recommended: {strategy.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={onRegisterInterest}
          disabled={interestRegistered}
          className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
        >
          {interestRegistered ? "On waitlist" : "Join waitlist"}
        </button>
        <p className="mt-1.5 text-[11px] leading-4 text-zinc-500">
          We&apos;ll let you know when push notifications become available.
        </p>
      </div>

      <p className="text-[10px] leading-4 text-zinc-400">
        Future integrations: {PUSH_FUTURE_PROVIDERS.join(", ")}
      </p>
    </div>
  );
}

type ChannelToggleProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onChange?: (checked: boolean) => void;
};

function ChannelToggle({
  label,
  checked,
  disabled = false,
  disabledReason,
  onChange,
}: ChannelToggleProps) {
  return (
    <label
      className={`group relative flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
        disabled
          ? "cursor-not-allowed border-zinc-100 bg-zinc-50/80"
          : "cursor-pointer border-zinc-200 bg-white hover:border-teal-200"
      }`}
      title={disabled ? disabledReason : undefined}
    >
      <span
        className={`text-sm font-medium ${
          disabled ? "text-zinc-400" : "text-zinc-800"
        }`}
      >
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
      />
    </label>
  );
}

type SmsSetupDrawerProps = {
  open: boolean;
  config: SmsChannelConfig;
  canEdit: boolean;
  onClose: () => void;
  onSave: (config: SmsChannelConfig) => void;
  onTest: () => void;
};

function SmsSetupDrawer({
  open,
  config,
  canEdit,
  onClose,
  onSave,
  onTest,
}: SmsSetupDrawerProps) {
  const [draft, setDraft] = useState(config);

  useModalDismiss(open, onClose);

  useEffect(() => {
    if (open) {
      setDraft(config);
    }
  }, [open, config]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...draft,
      connected: Boolean(draft.provider && draft.senderName.trim()),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close SMS setup"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl"
      >
        <div className="border-b border-zinc-100 bg-gradient-to-r from-teal-50/80 to-white px-6 py-5">
          <StatusBadge status="setup_required" />
          <h2 className="mt-3 text-lg font-semibold text-zinc-900">
            Connect SMS provider
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Configure your SMS provider credentials. Messages are not sent until
            you connect and enable channels per template.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Provider
            </span>
            <select
              value={draft.provider ?? ""}
              disabled={!canEdit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  provider: event.target.value
                    ? (event.target.value as SmsChannelConfig["provider"])
                    : null,
                }))
              }
              className={inputClassName}
            >
              <option value="">Select provider</option>
              {SMS_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              API key
            </span>
            <input
              type="password"
              value={draft.apiKey}
              disabled={!canEdit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  apiKey: event.target.value,
                }))
              }
              className={`${inputClassName} font-mono`}
              placeholder="sk_live_••••••••••••"
              autoComplete="off"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Stored locally for demo purposes only — not sent to a server yet.
            </p>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Sender name
            </span>
            <input
              value={draft.senderName}
              disabled={!canEdit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  senderName: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="e.g. PlayVera FC"
              maxLength={11}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onTest}
            disabled={!canEdit}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-teal-200 hover:text-teal-700 disabled:opacity-50"
          >
            Test SMS
          </button>
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ml-auto rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Save SMS settings
              </button>
            </>
          ) : null}
        </div>
      </form>
    </div>
  );
}

type WhatsAppSetupDrawerProps = {
  open: boolean;
  config: WhatsAppChannelConfig;
  canEdit: boolean;
  onClose: () => void;
  onSave: (config: WhatsAppChannelConfig) => void;
  onTest: () => void;
};

function WhatsAppSetupDrawer({
  open,
  config,
  canEdit,
  onClose,
  onSave,
  onTest,
}: WhatsAppSetupDrawerProps) {
  const [draft, setDraft] = useState(config);

  useModalDismiss(open, onClose);

  useEffect(() => {
    if (open) {
      setDraft(config);
    }
  }, [open, config]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...draft,
      connected: Boolean(
        draft.businessNumber.trim() && draft.provider,
      ),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close WhatsApp setup"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl"
      >
        <div className="border-b border-zinc-100 bg-gradient-to-r from-teal-50/80 to-white px-6 py-5">
          <StatusBadge status="setup_required" />
          <h2 className="mt-3 text-lg font-semibold text-zinc-900">
            Connect WhatsApp Business
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Link your WhatsApp Business number and track template approval
            status before sending automated messages.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              WhatsApp Business number
            </span>
            <input
              value={draft.businessNumber}
              disabled={!canEdit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  businessNumber: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="+44 7700 900123"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Provider
            </span>
            <select
              value={draft.provider ?? ""}
              disabled={!canEdit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  provider: event.target.value
                    ? (event.target.value as WhatsAppChannelConfig["provider"])
                    : null,
                }))
              }
              className={inputClassName}
            >
              <option value="">Select provider</option>
              {WHATSAPP_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Template approval status
            </span>
            <select
              value={draft.templateApprovalStatus}
              disabled={!canEdit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  templateApprovalStatus: event.target.value as WhatsAppChannelConfig["templateApprovalStatus"],
                }))
              }
              className={inputClassName}
            >
              {WHATSAPP_TEMPLATE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onTest}
            disabled={!canEdit}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-teal-200 hover:text-teal-700 disabled:opacity-50"
          >
            Test WhatsApp
          </button>
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ml-auto rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Save WhatsApp settings
              </button>
            </>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export function DeliveryChannelsSection({
  canEdit = true,
}: DeliveryChannelsSectionProps) {
  const [config, setConfig] = useState<DeliveryChannelsConfig>(
    getDeliveryChannelsConfig,
  );
  const [activeModal, setActiveModal] = useState<SetupModal>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pushInterestRegistered, setPushInterestRegistered] = useState(
    getPushNotificationsInterest,
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function persist(next: DeliveryChannelsConfig) {
    const normalized = saveDeliveryChannelsConfig(next);
    setConfig(normalized);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  function showDemoToast(channel: string) {
    setToast(`Demo: test ${channel} message sent`);
  }

  function handleRegisterPushInterest() {
    if (pushInterestRegistered) {
      return;
    }

    savePushNotificationsInterest();
    setPushInterestRegistered(true);
    setToast("You're on the waitlist — we'll notify you at launch.");
  }

  function updateTemplateChannel(
    templateKey: AutomatedTemplateKey,
    channel: "sms" | "whatsapp",
    enabled: boolean,
  ) {
    persist({
      ...config,
      templateChannels: {
        ...config.templateChannels,
        [templateKey]: {
          ...config.templateChannels[templateKey],
          [channel]: enabled,
        },
      },
    });
  }

  function handleSaveSms(sms: SmsChannelConfig) {
    persist({ ...config, sms });
  }

  function handleSaveWhatsApp(whatsapp: WhatsAppChannelConfig) {
    persist({ ...config, whatsapp });
  }

  const connectDisabledReason = "Connect this channel before enabling.";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        {CHANNEL_DEFINITIONS.map((channel) => {
          const isEmail = channel.id === "email";
          const isSms = channel.id === "sms";
          const isWhatsApp = channel.id === "whatsapp";
          const isPush = channel.id === "push";
          const isConnected =
            (isSms && config.sms.connected) ||
            (isWhatsApp && config.whatsapp.connected);

          return (
            <article
              key={channel.id}
              className={`rounded-2xl border p-4 transition-shadow ${
                isPush
                  ? "border-zinc-200/80 bg-gradient-to-br from-zinc-50/80 via-white to-teal-50/30 shadow-sm lg:col-span-2"
                  : isEmail
                    ? "border-teal-200/80 bg-gradient-to-br from-teal-50/50 to-white shadow-sm"
                    : isConnected
                      ? "border-teal-200/60 bg-white shadow-sm"
                      : "border-zinc-200/80 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {channel.label}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {channel.description}
                  </p>
                </div>
                <StatusBadge status={channel.status} />
              </div>

              {isEmail ? (
                <p className="mt-4 text-xs font-medium text-teal-700">
                  Enabled for all automated templates
                </p>
              ) : null}

              {isSms ? (
                <div className="mt-4 space-y-3">
                  {config.sms.connected ? (
                    <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2.5 text-xs text-teal-900">
                      <p className="font-semibold">
                        Connected via {getSmsProviderLabel(config.sms.provider)}
                      </p>
                      <p className="mt-0.5 text-teal-800/80">
                        Sender: {config.sms.senderName || "Not set"}
                      </p>
                    </div>
                  ) : null}
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => setActiveModal("sms")}
                      className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                    >
                      {config.sms.connected
                        ? "Manage SMS provider"
                        : "Connect SMS provider"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isWhatsApp ? (
                <div className="mt-4 space-y-3">
                  {config.whatsapp.connected ? (
                    <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2.5 text-xs text-teal-900">
                      <p className="font-semibold">
                        {config.whatsapp.businessNumber}
                      </p>
                      <p className="mt-0.5 text-teal-800/80">
                        {getWhatsAppProviderLabel(config.whatsapp.provider)} ·{" "}
                        {getWhatsAppTemplateStatusLabel(
                          config.whatsapp.templateApprovalStatus,
                        )}
                      </p>
                    </div>
                  ) : null}
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => setActiveModal("whatsapp")}
                      className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                    >
                      {config.whatsapp.connected
                        ? "Manage WhatsApp Business"
                        : "Connect WhatsApp Business"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isPush ? (
                <PushNotificationsCard
                  interestRegistered={pushInterestRegistered}
                  onRegisterInterest={handleRegisterPushInterest}
                />
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="border-t border-zinc-100 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Channel settings
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Choose which channels send each automated template. Email stays on
              by default.
            </p>
          </div>
          {saved ? (
            <span className="text-xs font-medium text-teal-700">
              Settings saved
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {(Object.keys(AUTOMATED_TEMPLATE_LABELS) as AutomatedTemplateKey[]).map(
            (templateKey) => {
              const meta = AUTOMATED_TEMPLATE_LABELS[templateKey];
              const toggles = config.templateChannels[templateKey];

              return (
                <div
                  key={templateKey}
                  className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4"
                >
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-zinc-900">
                      {meta.name}
                    </p>
                    <p className="text-xs text-zinc-500">{meta.description}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ChannelToggle
                      label="Email"
                      checked={toggles.email}
                      disabled
                    />
                    <ChannelToggle
                      label="SMS"
                      checked={toggles.sms}
                      disabled={!canEdit || !config.sms.connected}
                      disabledReason={connectDisabledReason}
                      onChange={(checked) =>
                        updateTemplateChannel(templateKey, "sms", checked)
                      }
                    />
                    <ChannelToggle
                      label="WhatsApp"
                      checked={toggles.whatsapp}
                      disabled={!canEdit || !config.whatsapp.connected}
                      disabledReason={connectDisabledReason}
                      onChange={(checked) =>
                        updateTemplateChannel(templateKey, "whatsapp", checked)
                      }
                    />
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      <SmsSetupDrawer
        open={activeModal === "sms"}
        config={config.sms}
        canEdit={canEdit}
        onClose={() => setActiveModal(null)}
        onSave={handleSaveSms}
        onTest={() => showDemoToast("SMS")}
      />

      <WhatsAppSetupDrawer
        open={activeModal === "whatsapp"}
        config={config.whatsapp}
        canEdit={canEdit}
        onClose={() => setActiveModal(null)}
        onSave={handleSaveWhatsApp}
        onTest={() => showDemoToast("WhatsApp")}
      />

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
