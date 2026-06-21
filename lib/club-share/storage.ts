import { shouldShowClubDemoData } from "@/lib/club-demo-mode";
import type {
  ShareEvent,
  ShareEventSource,
  ShareEventType,
  ShareMetrics,
  SharePlatform,
} from "./types";
import {
  SHARE_EVENTS_STORAGE_KEY,
  SHARE_METRICS_STORAGE_KEY,
} from "./types";
import {
  isInternalShareTraffic,
  logShareAnalyticsDebug,
  shouldTrackPublicShareAnalytics,
} from "./tracking";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readEvents(): ShareEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(SHARE_EVENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ShareEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: ShareEvent[]): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SHARE_EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function readMetricsStore(): ShareMetrics {
  if (typeof window === "undefined") {
    return defaultMetrics();
  }

  try {
    const raw = localStorage.getItem(SHARE_METRICS_STORAGE_KEY);
    if (!raw) {
      return defaultMetrics();
    }
    return { ...defaultMetrics(), ...(JSON.parse(raw) as ShareMetrics) };
  } catch {
    return defaultMetrics();
  }
}

function writeMetricsStore(metrics: ShareMetrics): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SHARE_METRICS_STORAGE_KEY, JSON.stringify(metrics));
}

function defaultMetrics(): ShareMetrics {
  return {
    profileVisits: 0,
    qrScans: 0,
    linkClicks: 0,
    bookingsFromShares: 0,
    topPlatform: null,
  };
}

function isPublicEvent(event: ShareEvent): boolean {
  if (event.isPublic === false) {
    return false;
  }

  // Legacy: dashboard "copy link" was mislabeled as link_click.
  if (event.type === "link_click" && event.platform === "copy_link") {
    return false;
  }

  if (event.source === "club_dashboard") {
    return false;
  }

  return event.isPublic === true;
}

function publicEvents(events: ShareEvent[]): ShareEvent[] {
  return events.filter(isPublicEvent);
}

function computeTopPlatform(events: ShareEvent[]): SharePlatform | null {
  const counts = new Map<SharePlatform, number>();

  for (const event of events) {
    if (event.type !== "social_share" || !event.platform) {
      continue;
    }
    counts.set(event.platform, (counts.get(event.platform) ?? 0) + 1);
  }

  let top: SharePlatform | null = null;
  let max = 0;
  for (const [platform, count] of counts) {
    if (count > max) {
      max = count;
      top = platform;
    }
  }
  return top;
}

function metricsFromPublicEvents(events: ShareEvent[]): ShareMetrics {
  const publicOnly = publicEvents(events);

  return {
    profileVisits: publicOnly.filter((e) => e.type === "profile_visit").length,
    qrScans: publicOnly.filter((e) => e.type === "qr_scan").length,
    linkClicks: publicOnly.filter((e) => e.type === "link_click").length,
    bookingsFromShares: publicOnly.filter((e) => e.type === "booking_from_share")
      .length,
    topPlatform: computeTopPlatform(publicOnly),
  };
}

export function trackShareEvent(
  type: ShareEventType,
  platform?: SharePlatform,
  options?: {
    source?: ShareEventSource;
    forcePublic?: boolean;
  },
): ShareEvent | null {
  const source = options?.source ?? "unknown";
  const isPublic =
    options?.forcePublic === true ||
    (options?.forcePublic !== false &&
      shouldTrackPublicShareAnalytics() &&
      source !== "club_dashboard");

  if (!isPublic) {
    logShareAnalyticsDebug("trackShareEvent skipped (internal)", {
      eventType: type,
      platform,
      source,
      internal: isInternalShareTraffic(),
    });
    return null;
  }

  const event: ShareEvent = {
    id: createId(),
    type,
    platform,
    timestamp: new Date().toISOString(),
    isPublic: true,
    source,
  };

  const events = [...readEvents(), event];
  writeEvents(events);

  logShareAnalyticsDebug("trackShareEvent recorded", {
    eventType: type,
    platform,
    source,
    eventId: event.id,
  });

  return event;
}

export function trackProfileVisit(
  source: ShareEventSource = "public_profile",
): void {
  if (!shouldTrackPublicShareAnalytics()) {
    logShareAnalyticsDebug("trackProfileVisit skipped (internal)", {
      source,
      internal: isInternalShareTraffic(),
    });
    return;
  }

  const event: ShareEvent = {
    id: createId(),
    type: "profile_visit",
    timestamp: new Date().toISOString(),
    isPublic: true,
    source,
  };

  const events = [...readEvents(), event];
  writeEvents(events);

  logShareAnalyticsDebug("trackProfileVisit recorded", {
    source,
    eventId: event.id,
  });
}

export function getShareEvents(): ShareEvent[] {
  return readEvents();
}

export function getShareMetrics(pathname?: string): ShareMetrics {
  if (shouldShowClubDemoData(pathname)) {
    const demo = getDemoShareMetrics();
    logShareAnalyticsDebug("getShareMetrics (demo seed)", {
      source: "demo-seed",
      metrics: demo,
    });
    return demo;
  }

  const events = readEvents();
  const fromEvents = metricsFromPublicEvents(events);

  logShareAnalyticsDebug("getShareMetrics", {
    source: "localStorage-public-events",
    profileVisits: {
      value: fromEvents.profileVisits,
      eventType: "profile_visit",
    },
    qrScans: {
      value: fromEvents.qrScans,
      eventType: "qr_scan",
    },
    linkClicks: {
      value: fromEvents.linkClicks,
      eventType: "link_click",
    },
    bookingsFromShares: {
      value: fromEvents.bookingsFromShares,
      eventType: "booking_from_share",
    },
    rawEventCount: events.length,
    publicEventCount: publicEvents(events).length,
  });

  return fromEvents;
}

function getDemoShareMetrics(): ShareMetrics {
  return {
    profileVisits: 128,
    qrScans: 34,
    linkClicks: 52,
    bookingsFromShares: 7,
    topPlatform: "whatsapp",
  };
}

export function getPlatformBreakdown(pathname?: string): Array<{
  platform: SharePlatform;
  count: number;
}> {
  if (shouldShowClubDemoData(pathname)) {
    return [
      { platform: "whatsapp", count: 18 },
      { platform: "facebook", count: 11 },
      { platform: "copy_link", count: 9 },
      { platform: "instagram", count: 6 },
    ];
  }

  const counts = new Map<SharePlatform, number>();

  for (const event of publicEvents(readEvents())) {
    if (event.type === "social_share" && event.platform) {
      counts.set(event.platform, (counts.get(event.platform) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

export function getRecentShareEvents(limit = 20): ShareEvent[] {
  return publicEvents(readEvents())
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

/** Clears legacy inflated counters; events are the source of truth. */
export function resetLegacyShareMetricsStore(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(SHARE_METRICS_STORAGE_KEY);
}
