"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PLATFORM_SETTINGS,
  getPlatformSettings,
  PLATFORM_SETTINGS_KEY,
} from "@/lib/admin/settings";

export function useAiSearchAssistantEnabled(): boolean {
  const [enabled, setEnabled] = useState(
    DEFAULT_PLATFORM_SETTINGS.aiAssistantEnabled,
  );

  useEffect(() => {
    function readSettings() {
      setEnabled(getPlatformSettings().aiAssistantEnabled);
    }

    readSettings();

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === PLATFORM_SETTINGS_KEY) {
        readSettings();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return enabled;
}
