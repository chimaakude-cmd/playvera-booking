import type {
  ShareEvent,
  ShareEventType,
  ShareMetrics,
  SharePlatform,
} from "./types";
import {
  SHARE_EVENTS_STORAGE_KEY,
  SHARE_METRICS_STORAGE_KEY,
} from "./types";

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

export function trackShareEvent(
  type: ShareEventType,
  platform?: SharePlatform,
): ShareEvent {
  const event: ShareEvent = {
    id: createId(),
    type,
    platform,
    timestamp: new Date().toISOString(),
  };

  const events = [...readEvents(), event];
  writeEvents(events);

  const metrics = readMetricsStore();
  if (type === "qr_scan") {
    metrics.qrScans += 1;
  } else if (type === "link_click") {
    metrics.linkClicks += 1;
  }
  metrics.topPlatform = computeTopPlatform(events);
  writeMetricsStore(metrics);

  return event;
}

export function trackProfileVisit(): void {
  const metrics = readMetricsStore();
  metrics.profileVisits += 1;
  writeMetricsStore(metrics);
}

export function getShareEvents(): ShareEvent[] {
  return readEvents();
}

export function getShareMetrics(): ShareMetrics {
  const stored = readMetricsStore();
  const events = readEvents();

  const qrScansFromEvents = events.filter((e) => e.type === "qr_scan").length;
  const linkClicksFromEvents = events.filter(
    (e) => e.type === "link_click",
  ).length;

  return {
    profileVisits: stored.profileVisits,
    qrScans: Math.max(stored.qrScans, qrScansFromEvents),
    linkClicks: Math.max(stored.linkClicks, linkClicksFromEvents),
    bookingsFromShares: stored.bookingsFromShares || mockBookingsFromShares(),
    topPlatform: stored.topPlatform ?? computeTopPlatform(events),
  };
}

function mockBookingsFromShares(): number {
  const events = readEvents();
  const socialShares = events.filter((e) => e.type === "social_share").length;
  const qrScans = events.filter((e) => e.type === "qr_scan").length;
  return Math.floor(socialShares * 0.15 + qrScans * 0.08);
}

export function getPlatformBreakdown(): Array<{
  platform: SharePlatform;
  count: number;
}> {
  const counts = new Map<SharePlatform, number>();

  for (const event of readEvents()) {
    if (event.type === "social_share" && event.platform) {
      counts.set(event.platform, (counts.get(event.platform) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

export function getRecentShareEvents(limit = 20): ShareEvent[] {
  return readEvents()
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}
