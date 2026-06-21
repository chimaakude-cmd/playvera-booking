"use client";

import { useEffect } from "react";
import {
  isPublicSharedLinkArrival,
  logShareAnalyticsDebug,
  shouldTrackPublicShareAnalytics,
} from "@/lib/club-share/tracking";
import { trackProfileVisit, trackShareEvent } from "@/lib/club-share";

export function ClubPublicPageTracker() {
  useEffect(() => {
    if (!shouldTrackPublicShareAnalytics()) {
      logShareAnalyticsDebug("ClubPublicPageTracker skipped (internal)", {
        pathname: window.location.pathname,
      });
      return;
    }

    trackProfileVisit("public_profile");

    const params = new URLSearchParams(window.location.search);
    if (params.get("src") === "qr") {
      trackShareEvent("qr_scan", undefined, { source: "public_profile" });
      return;
    }

    if (isPublicSharedLinkArrival()) {
      trackShareEvent("link_click", undefined, { source: "public_profile" });
    }
  }, []);

  return null;
}
