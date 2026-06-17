"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/admin/settings";
import { hydratePlatformPublicSettings } from "@/lib/platform-settings/client-cache";

export function useAiSearchAssistantEnabled(): boolean {
  const [enabled, setEnabled] = useState(
    DEFAULT_PLATFORM_SETTINGS.aiAssistantEnabled,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const settings = await hydratePlatformPublicSettings();
      if (!cancelled) {
        setEnabled(settings.aiSearchAssistantEnabled);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
