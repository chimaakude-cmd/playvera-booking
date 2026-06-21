"use client";

import { use, useEffect, useState } from "react";
import { EmbedActivityWidget } from "@/components/embed/EmbedActivityWidget";
import { EmbedPageTracker } from "@/components/club/public/EmbedPageTracker";
import {
  DEFAULT_WIDGET_SETTINGS,
  getWidgetSettingsForProvider,
  parseWidgetSettingsFromSearchParams,
  type ClubWidgetSettings,
} from "@/lib/club-widget";

export default function EmbedActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ activityId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { activityId } = use(params);
  const resolvedSearch = use(searchParams);
  const [settings, setSettings] = useState<ClubWidgetSettings>(
    DEFAULT_WIDGET_SETTINGS,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const paramsObj = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearch)) {
      if (typeof value === "string") paramsObj.set(key, value);
    }

    const stored = getWidgetSettingsForProvider("demo");
    const fromQuery = parseWidgetSettingsFromSearchParams(paramsObj, "demo");
    setSettings({ ...stored, ...fromQuery });
    setReady(true);
  }, [resolvedSearch]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <>
      <EmbedPageTracker providerId={activityId} />
      <EmbedActivityWidget activityId={activityId} settings={settings} />
    </>
  );
}
