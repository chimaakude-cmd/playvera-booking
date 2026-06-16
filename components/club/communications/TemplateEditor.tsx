"use client";

import { useState } from "react";
import {
  applyMergeTags,
  CHANNEL_LABELS,
  createSampleMergeContext,
  MERGE_TAGS,
  SEND_TIMING_LABELS,
  type MessageChannel,
  type MessageTemplate,
  type SendTiming,
} from "@/lib/club-communications";

type TemplateEditorProps = {
  template: MessageTemplate;
  canEdit: boolean;
  onSave: (template: MessageTemplate) => void;
};

const ACTIVE_CHANNELS: MessageChannel[] = ["email"];
const FUTURE_CHANNELS: MessageChannel[] = ["sms", "whatsapp"];

export function TemplateEditor({
  template,
  canEdit,
  onSave,
}: TemplateEditorProps) {
  const [draft, setDraft] = useState<MessageTemplate>(template);
  const [showPreview, setShowPreview] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const sampleContext = createSampleMergeContext();

  function updateDraft(updates: Partial<MessageTemplate>) {
    setDraft((current) => ({ ...current, ...updates }));
    setSavedMessage(null);
  }

  function handleSave() {
    onSave(draft);
    setSavedMessage("Template saved.");
  }

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-200">
              {draft.code}
            </span>
            <h3 className="text-base font-semibold text-zinc-900">{draft.name}</h3>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{draft.description}</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            checked={draft.enabled}
            disabled={!canEdit}
            onChange={(event) => updateDraft({ enabled: event.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
          />
          Enabled
        </label>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Template name</span>
            <input
              type="text"
              value={draft.name}
              disabled={!canEdit}
              onChange={(event) => updateDraft({ name: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 disabled:bg-zinc-50 disabled:opacity-60"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Send timing</span>
            <select
              value={draft.sendTiming}
              disabled={!canEdit}
              onChange={(event) =>
                updateDraft({ sendTiming: event.target.value as SendTiming })
              }
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 disabled:opacity-60"
            >
              {(Object.keys(SEND_TIMING_LABELS) as SendTiming[]).map((timing) => (
                <option key={timing} value={timing}>
                  {SEND_TIMING_LABELS[timing]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-700">Channel</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACTIVE_CHANNELS.map((channel) => (
              <button
                key={channel}
                type="button"
                disabled={!canEdit}
                onClick={() => updateDraft({ channel })}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  draft.channel === channel
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                } disabled:opacity-60`}
              >
                {CHANNEL_LABELS[channel]}
              </button>
            ))}
            {FUTURE_CHANNELS.map((channel) => (
              <span
                key={channel}
                className="rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400"
              >
                {CHANNEL_LABELS[channel]} — coming soon
              </span>
            ))}
          </div>
        </div>

        {draft.channel === "email" ? (
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Email subject</span>
            <input
              type="text"
              value={draft.subject}
              disabled={!canEdit}
              onChange={(event) => updateDraft({ subject: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 disabled:bg-zinc-50 disabled:opacity-60"
            />
          </label>
        ) : null}

        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Message body</span>
          <textarea
            value={draft.body}
            disabled={!canEdit}
            rows={4}
            onChange={(event) => updateDraft({ body: event.target.value })}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm leading-6 text-zinc-900 disabled:bg-zinc-50 disabled:opacity-60"
          />
        </label>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Merge tags
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MERGE_TAGS.map((entry) => (
              <code
                key={entry.tag}
                className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
              >
                {entry.tag}
              </code>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            {showPreview ? "Hide preview" : "Preview"}
          </button>
          {canEdit ? (
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Save template
            </button>
          ) : null}
          {savedMessage ? (
            <span className="text-sm font-medium text-emerald-700">
              {savedMessage}
            </span>
          ) : null}
        </div>

        {showPreview ? (
          <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Preview
            </p>
            {draft.channel === "email" ? (
              <p className="mt-2 text-sm font-semibold text-zinc-900">
                Subject: {applyMergeTags(draft.subject, sampleContext)}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              {applyMergeTags(draft.body, sampleContext)}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
