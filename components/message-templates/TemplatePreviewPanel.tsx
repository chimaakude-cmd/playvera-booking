"use client";

import {
  applyTemplateVariables,
  createSampleMergeContext,
  type MessageTemplateRecord,
} from "@/lib/message-templates";

type TemplatePreviewPanelProps = {
  template: Pick<MessageTemplateRecord, "subject" | "body" | "channel" | "channels">;
  accent?: "violet" | "teal";
};

const ACCENT_STYLES = {
  violet: {
    container: "border-violet-100 bg-violet-50/50",
    label: "text-violet-700",
  },
  teal: {
    container: "border-teal-100 bg-teal-50/40",
    label: "text-teal-700",
  },
} as const;

export function TemplatePreviewPanel({
  template,
  accent = "teal",
}: TemplatePreviewPanelProps) {
  const sampleContext = createSampleMergeContext();
  const styles = ACCENT_STYLES[accent];
  const showSubject =
    template.channels.includes("email") || template.channel === "email";

  return (
    <div className={`rounded-xl border p-4 ${styles.container}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}>
        Live preview
      </p>
      {showSubject ? (
        <p className="mt-2 text-sm font-semibold text-zinc-900">
          Subject: {applyTemplateVariables(template.subject, sampleContext)}
        </p>
      ) : null}
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-700">
        {applyTemplateVariables(template.body, sampleContext)}
      </pre>
    </div>
  );
}
