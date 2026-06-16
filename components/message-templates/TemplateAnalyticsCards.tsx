"use client";

import {
  formatAnalyticsRate,
  getMockTemplateAnalytics,
  type TemplateKey,
} from "@/lib/message-templates";

type TemplateAnalyticsCardsProps = {
  templateKey: TemplateKey;
  scope?: "platform" | "club";
  accent?: "violet" | "teal";
};

export function TemplateAnalyticsCards({
  templateKey,
  scope = "platform",
  accent = "violet",
}: TemplateAnalyticsCardsProps) {
  const stats = getMockTemplateAnalytics(templateKey, scope);
  const ringClass =
    accent === "violet" ? "ring-violet-100" : "ring-teal-100";

  const items = [
    { label: "Delivered", value: stats.delivered.toLocaleString("en-GB") },
    {
      label: "Opened",
      value: `${stats.opened.toLocaleString("en-GB")} (${formatAnalyticsRate(stats.opened, stats.delivered)})`,
    },
    {
      label: "Clicked",
      value: `${stats.clicked.toLocaleString("en-GB")} (${formatAnalyticsRate(stats.clicked, stats.delivered)})`,
    },
    { label: "Failed", value: stats.failed.toLocaleString("en-GB") },
    { label: "Unsubscribed", value: stats.unsubscribed.toLocaleString("en-GB") },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 ring-1 ring-inset ${ringClass}`}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
