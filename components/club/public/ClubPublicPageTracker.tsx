"use client";

import { useEffect } from "react";
import { trackProfileVisit, trackShareEvent } from "@/lib/club-share";

export function ClubPublicPageTracker() {
  useEffect(() => {
    trackProfileVisit();
    const params = new URLSearchParams(window.location.search);
    if (params.get("src") === "qr") {
      trackShareEvent("qr_scan");
    }
  }, []);

  return null;
}
