"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { TemplatePreviewPanel } from "@/components/message-templates/TemplatePreviewPanel";
import { TemplateVariableChips } from "@/components/message-templates/TemplateVariableChips";
import { TemplateAnalyticsCards } from "@/components/message-templates/TemplateAnalyticsCards";
import {
  CHANNEL_LABELS,
  SEND_TIMING_LABELS,
  cloneTemplateForProvider,
  dismissTemplatesOnboardingBanner,
  formatAnalyticsRate,
  getAllMockAnalytics,
  getClubTemplatesView,
  restoreClubTemplateDefault,
  saveClubTemplateOverride,
  shouldShowTemplatesOnboardingBanner,
  type MessageChannel,
  type MessageTemplateRecord,
  type SendTiming,
  type TemplateKey,
} from "@/lib/message-templates";

type PlatformTemplatesSectionProps = {
  canEdit: boolean;
};

const ACTIVE_CHANNELS: MessageChannel[] = ["email"];

function ClubTemplateEditDrawer({
  open,
  template,
  onClose,
  onSave,
}: {
  open: boolean;
  template: MessageTemplateRecord | null;
  onClose: () => void;
  onSave: (template: MessageTemplateRecord) => void;
}) {
  const [draft, setDraft] = useState<MessageTemplateRecord | null>(null);
  useModalDismiss(open, onClose);

  useEffect(() => {
    if (template) {
      setDraft({ ...template });
    }
  }, [template]);

  if (!open || !draft) {
    return null;
  }

  function updateDraft(updates: Partial<MessageTemplateRecord>) {
    setDraft((current) => (current ? { ...current, ...updates } : current));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-200">
                {draft.templateKey}
              </span>
              <h2 className="text-lg font-semibold text-zinc-900">
                Custom template
              </h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{draft.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) => updateDraft({ enabled: event.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-teal-600"
            />
            Enabled
          </label>

          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Template name</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Send timing</span>
            <select
              value={draft.sendDelay}
              onChange={(event) =>
                updateDraft({ sendDelay: event.target.value as SendTiming })
              }
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            >
              {(Object.keys(SEND_TIMING_LABELS) as SendTiming[]).map((timing) => (
                <option key={timing} value={timing}>
                  {SEND_TIMING_LABELS[timing]}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-medium text-zinc-700">Channel</p>
            <div className="mt-2 flex gap-2">
              {ACTIVE_CHANNELS.map((channel) => (
                <span
                  key={channel}
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                >
                  {CHANNEL_LABELS[channel]}
                </span>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Email subject</span>
            <input
              type="text"
              value={draft.subject}
              onChange={(event) => updateDraft({ subject: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Message body</span>
            <textarea
              value={draft.body}
              rows={6}
              onChange={(event) => updateDraft({ body: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm leading-6"
            />
          </label>

          <TemplateVariableChips compact />
          <TemplatePreviewPanel template={draft} accent="teal" />
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Save custom version
          </button>
        </div>
      </aside>
    </div>
  );
}

export function PlatformTemplatesSection({ canEdit }: PlatformTemplatesSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewKey, setPreviewKey] = useState<TemplateKey | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplateRecord | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(shouldShowTemplatesOnboardingBanner());
  }, []);

  const templateViews = useMemo(() => {
    void refreshKey;
    return getClubTemplatesView();
  }, [refreshKey]);

  const analytics = useMemo(() => getAllMockAnalytics("club"), [refreshKey]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function handleDuplicate(templateKey: TemplateKey) {
    if (!canEdit) {
      return;
    }

    const clone = cloneTemplateForProvider(templateKey);
    setEditingTemplate(clone);
    refresh();
  }

  function handleRestore(templateKey: TemplateKey) {
    if (!canEdit) {
      return;
    }

    restoreClubTemplateDefault(templateKey);
    refresh();
  }

  function handleDismissBanner() {
    dismissTemplatesOnboardingBanner();
    setShowBanner(false);
  }

  return (
    <div className="space-y-4">
      {showBanner ? (
        <div className="relative rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-4 pr-10">
          <p className="text-sm font-semibold text-teal-900">
            Your account comes preconfigured with:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-teal-800">
            {[
              "Booking emails",
              "Payment receipts",
              "Reminders",
              "Refund emails",
              "Review requests",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-teal-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleDismissBanner}
            className="absolute right-3 top-3 rounded-lg p-1 text-teal-600 hover:bg-teal-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-zinc-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Sent (30d)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {templateViews.map(
                ({ templateKey, effectiveTemplate, usesDefault }) => {
                  const stats = analytics.find(
                    (entry) => entry.templateKey === templateKey,
                  );

                  return (
                    <tr key={templateKey} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                            {templateKey}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {effectiveTemplate.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {effectiveTemplate.enabled ? "Enabled" : "Disabled"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            usesDefault
                              ? "bg-zinc-100 text-zinc-700"
                              : "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200"
                          }`}
                        >
                          {usesDefault ? "Platform default" : "Custom version"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-zinc-600">
                        {stats?.delivered.toLocaleString("en-GB") ?? "—"}
                        {stats ? (
                          <span className="ml-2 text-xs text-zinc-400">
                            ({formatAnalyticsRate(stats.opened, stats.delivered)}{" "}
                            opened)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewKey((current) =>
                                current === templateKey ? null : templateKey,
                              )
                            }
                            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            Preview
                          </button>
                          {canEdit ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (usesDefault) {
                                    handleDuplicate(templateKey);
                                  } else {
                                    setEditingTemplate(effectiveTemplate);
                                  }
                                }}
                                className="rounded-lg border border-teal-200 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                              >
                                {usesDefault ? "Duplicate & customise" : "Edit"}
                              </button>
                              {!usesDefault ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestore(templateKey)}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
                                >
                                  Restore default
                                </button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewKey ? (
        <div className="space-y-3">
          <TemplatePreviewPanel
            template={
              templateViews.find((entry) => entry.templateKey === previewKey)!
                .effectiveTemplate
            }
            accent="teal"
          />
          <TemplateAnalyticsCards
            templateKey={previewKey}
            scope="club"
            accent="teal"
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4">
        <p className="text-sm font-medium text-zinc-900">Available variables</p>
        <div className="mt-3">
          <TemplateVariableChips />
        </div>
      </div>

      <ClubTemplateEditDrawer
        open={editingTemplate !== null}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={(template) => {
          saveClubTemplateOverride(template);
          refresh();
        }}
      />
    </div>
  );
}
