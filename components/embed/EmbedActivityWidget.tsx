"use client";

import { EmbedProviderWidget, filterSessionsForWidget } from "./EmbedProviderWidget";
import type { ClubWidgetSettings } from "@/lib/club-widget";
import { getSessionById } from "@/lib/sessions";

type EmbedActivityWidgetProps = {
  activityId: string;
  settings: ClubWidgetSettings;
};

export function EmbedActivityWidget({
  activityId,
  settings,
}: EmbedActivityWidgetProps) {
  const session = getSessionById(activityId);
  const sessions = session ? [session] : [];

  const activitySettings: ClubWidgetSettings = {
    ...settings,
    activityScope: "selected",
    selectedActivityIds: [activityId],
  };

  return (
    <EmbedProviderWidget
      providerId={settings.providerId}
      settings={activitySettings}
      sessions={filterSessionsForWidget(sessions, activitySettings)}
    />
  );
}
