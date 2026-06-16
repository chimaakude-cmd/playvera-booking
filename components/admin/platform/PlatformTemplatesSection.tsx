"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import {
  formatAnalyticsRate,
  getAllMockAnalytics,
  getPlatformTemplates,
  savePlatformTemplate,
  seedPlatformTemplatesIfEmpty,
  type BulkApplyScope,
  type MessageTemplateRecord,
} from "@/lib/message-templates";
import { BulkApplyModal } from "./BulkApplyModal";
import { PlatformTemplateEditDrawer } from "./PlatformTemplateEditDrawer";

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex h-2 w-2 rounded-full ${
        enabled ? "bg-emerald-500" : "bg-zinc-300"
      }`}
    />
  );
}

export function PlatformTemplatesSection() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplateRecord | null>(null);
  const [bulkTemplate, setBulkTemplate] = useState<MessageTemplateRecord | null>(
    null,
  );
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    seedPlatformTemplatesIfEmpty();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const templates = useMemo(() => {
    void refreshKey;
    return getPlatformTemplates();
  }, [refreshKey]);

  const analytics = useMemo(() => getAllMockAnalytics("platform"), [refreshKey]);

  function handleSave(template: MessageTemplateRecord) {
    savePlatformTemplate(template);
    setRefreshKey((current) => current + 1);
    setToast(`"${template.name}" saved.`);
  }

  function handleBulkConfirm(scope: BulkApplyScope) {
    void scope;
    setBulkTemplate(null);
    setToast("Template update queued for providers.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Default message templates"
        description="Platform master templates inherited by all providers. Clubs can override individually."
      />

      <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm leading-6 text-violet-900">
        New providers automatically receive these templates with zero setup.
        Changes here apply to clubs using platform defaults.
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-zinc-50/80">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Template
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Timing
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Delivered
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Open rate
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {templates.map((template) => {
                const stats = analytics.find(
                  (entry) => entry.templateKey === template.templateKey,
                );

                return (
                  <tr
                    key={template.id}
                    className="transition-colors hover:bg-zinc-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                          {template.templateKey}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {template.name}
                          </p>
                          <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-500">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-600">
                      {template.sendDelay.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-sm tabular-nums text-zinc-700">
                      {stats?.delivered.toLocaleString("en-GB") ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm tabular-nums text-zinc-700">
                      {stats
                        ? formatAnalyticsRate(stats.opened, stats.delivered)
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-zinc-700">
                        <StatusDot enabled={template.enabled} />
                        {template.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewKey((current) =>
                              current === template.templateKey
                                ? null
                                : template.templateKey,
                            )
                          }
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTemplate(template)}
                          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {previewKey ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            Preview — template {previewKey}
          </p>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-violet-50/50 p-4 text-sm leading-6 text-zinc-700">
            {templates.find((entry) => entry.templateKey === previewKey)?.body}
          </pre>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PlatformTemplateEditDrawer
        open={editingTemplate !== null}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={handleSave}
        onBulkApply={(template) => {
          setEditingTemplate(null);
          setBulkTemplate(template);
        }}
      />

      <BulkApplyModal
        open={bulkTemplate !== null}
        template={bulkTemplate}
        onClose={() => setBulkTemplate(null)}
        onConfirm={handleBulkConfirm}
      />
    </div>
  );
}
