import type { TemplateAnalytics, TemplateKey } from "./types";
import { TEMPLATE_KEY_ORDER } from "./types";

function hashKey(key: TemplateKey): number {
  return key.charCodeAt(0) * 137 + 42;
}

export function getMockTemplateAnalytics(
  templateKey: TemplateKey,
  scope: "platform" | "club" = "platform",
): TemplateAnalytics {
  const seed = hashKey(templateKey) + (scope === "club" ? 17 : 0);
  const delivered = 800 + seed * 47;
  const opened = Math.round(delivered * (0.42 + (seed % 10) / 100));
  const clicked = Math.round(opened * (0.18 + (seed % 5) / 100));
  const failed = Math.max(1, Math.round(delivered * 0.012));
  const unsubscribed = Math.max(0, Math.round(delivered * 0.003));

  return {
    templateKey,
    delivered,
    opened,
    clicked,
    failed,
    unsubscribed,
  };
}

export function getAllMockAnalytics(
  scope: "platform" | "club" = "platform",
): TemplateAnalytics[] {
  return TEMPLATE_KEY_ORDER.map((key) => getMockTemplateAnalytics(key, scope));
}

export function formatAnalyticsRate(value: number, total: number): string {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}
