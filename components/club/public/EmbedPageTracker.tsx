"use client";

import { useEffect } from "react";
import {
  logShareAnalyticsDebug,
  shouldTrackPublicShareAnalytics,
} from "@/lib/club-share/tracking";
import { trackProfileVisit } from "@/lib/club-share";

type EmbedPageTrackerProps = {
  providerId: string;
};

export function EmbedPageTracker({ providerId }: EmbedPageTrackerProps) {
  useEffect(() => {
    if (!shouldTrackPublicShareAnalytics()) {
      logShareAnalyticsDebug("EmbedPageTracker skipped (internal preview)", {
        providerId,
        pathname: window.location.pathname,
      });
      return;
    }

    trackProfileVisit("public_widget");

    logShareAnalyticsDebug("EmbedPageTracker recorded public widget open", {
      providerId,
    });
  }, [providerId]);

  return null;
}
