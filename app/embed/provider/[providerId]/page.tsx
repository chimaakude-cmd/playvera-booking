"use client";

import { use, useEffect, useState } from "react";
import {
  EmbedProviderWidget,
  filterSessionsForWidget,
} from "@/components/embed/EmbedProviderWidget";
import {
  DEFAULT_WIDGET_SETTINGS,
  getWidgetSettingsForProvider,
  parseWidgetSettingsFromSearchParams,
  type ClubWidgetSettings,
} from "@/lib/club-widget";
import { getClubProfile } from "@/lib/club-profile";
import { ClubSession, getSessions } from "@/lib/sessions";

export default function EmbedProviderPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { providerId } = use(params);
  const resolvedSearch = use(searchParams);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [settings, setSettings] = useState<ClubWidgetSettings>(
    DEFAULT_WIDGET_SETTINGS,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const paramsObj = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearch)) {
      if (typeof value === "string") paramsObj.set(key, value);
    }

    const stored = getWidgetSettingsForProvider(providerId);
    const fromQuery = parseWidgetSettingsFromSearchParams(paramsObj, providerId);
    setSettings({ ...stored, ...fromQuery, providerId });
    setSessions(
      getSessions().filter((session) => session.published !== false),
    );
    setReady(true);
  }, [providerId, resolvedSearch]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  const profile = getClubProfile();
  const filtered = filterSessionsForWidget(sessions, settings);

  return (
    <EmbedProviderWidget
      providerId={providerId}
      settings={settings}
      sessions={filtered}
      clubName={profile?.clubName}
      logoUrl={profile?.logoUrl}
    />
  );
}
