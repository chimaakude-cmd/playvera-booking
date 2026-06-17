"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { TemplatePreviewPanel } from "@/components/message-templates/TemplatePreviewPanel";
import { TemplateVariableChips } from "@/components/message-templates/TemplateVariableChips";
import {
  CHANNEL_LABELS,
  SEND_TIMING_LABELS,
  type MessageChannel,
  type MessageTemplateRecord,
  type SendTiming,
} from "@/lib/message-templates";

type PlatformTemplateEditDrawerProps = {
  open: boolean;
  template: MessageTemplateRecord | null;
  onClose: () => void;
  onSave: (template: MessageTemplateRecord) => void;
  onBulkApply: (template: MessageTemplateRecord) => void;
};

const ALL_CHANNELS: MessageChannel[] = ["email", "sms", "whatsapp"];
const ACTIVE_CHANNELS: MessageChannel[] = ["email"];

export function PlatformTemplateEditDrawer({
  open,
  template,
  onClose,
  onSave,
  onBulkApply,
}: PlatformTemplateEditDrawerProps) {
  const [draft, setDraft] = useState<MessageTemplateRecord | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  useModalDismiss(open, onClose);

  useEffect(() => {
    if (template) {
      setDraft({ ...template });
      setShowPreview(true);
    }
  }, [template]);

  if (!open || !draft) {
    return null;
  }

  function updateDraft(updates: Partial<MessageTemplateRecord>) {
    setDraft((current) => (current ? { ...current, ...updates } : current));
  }

  function toggleChannel(channel: MessageChannel) {
    if (!ACTIVE_CHANNELS.includes(channel)) {
      return;
    }

    const channels = draft!.channels.includes(channel)
      ? draft!.channels.filter((entry) => entry !== channel)
      : [...draft!.channels, channel];

    if (channels.length === 0) {
      return;
    }

    updateDraft({ channels, channel: channels[0] });
  }

  function insertVariable(tag: string, field: "subject" | "body") {
    updateDraft({ [field]: `${draft![field]}${tag}` });
  }

  function handleSave() {
    if (!draft) {
      return;
    }

    onSave(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-inset ring-violet-200">
                {draft.templateKey}
              </span>
              <h2 className="text-lg font-semibold text-zinc-900">
                Edit platform template
              </h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{draft.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">Enabled</p>
                <p className="text-xs text-zinc-500">
                  Disabled templates are not sent to any provider.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    updateDraft({ enabled: event.target.checked })
                  }
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full" />
              </label>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Template name</span>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Send timing</span>
              <select
                value={draft.sendDelay}
                onChange={(event) =>
                  updateDraft({ sendDelay: event.target.value as SendTiming })
                }
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                {(Object.keys(SEND_TIMING_LABELS) as SendTiming[]).map(
                  (timing) => (
                    <option key={timing} value={timing}>
                      {SEND_TIMING_LABELS[timing]}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div>
              <p className="text-sm font-medium text-zinc-700">Channels</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_CHANNELS.map((channel) => {
                  const isActive = ACTIVE_CHANNELS.includes(channel);
                  const selected = draft.channels.includes(channel);

                  return isActive ? (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? "bg-violet-600 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {CHANNEL_LABELS[channel]}
                    </button>
                  ) : (
                    <span
                      key={channel}
                      className="rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400"
                    >
                      {CHANNEL_LABELS[channel]} — coming soon
                    </span>
                  );
                })}
              </div>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Email subject</span>
              <input
                type="text"
                value={draft.subject}
                onChange={(event) => updateDraft({ subject: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Message body</span>
              <textarea
                value={draft.body}
                rows={8}
                onChange={(event) => updateDraft({ body: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm leading-6 text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </label>

            <div>
              <p className="text-sm font-medium text-zinc-700">Analytics (30 days)</p>
              <p className="mt-2 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm leading-6 text-violet-900">
                Analytics will appear once real messages are sent.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-700">Variables</p>
              <p className="mt-1 text-xs text-zinc-500">
                Click to insert into the message body.
              </p>
              <div className="mt-3">
                <TemplateVariableChips
                  onInsert={(tag) => insertVariable(tag, "body")}
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowPreview((current) => !current)}
                className="text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                {showPreview ? "Hide preview" : "Show preview"}
              </button>
              {showPreview ? (
                <div className="mt-3">
                  <TemplatePreviewPanel template={draft} accent="violet" />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={() => onBulkApply(draft)}
            className="rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
          >
            Apply to providers…
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Save template
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
