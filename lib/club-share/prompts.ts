import { getShareEvents } from "./storage";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export type SharePrompt = {
  message: string;
  ctaLabel: string;
  variant: "info" | "warning";
};

export function getSharePrompt(): SharePrompt | null {
  const events = getShareEvents();
  const now = Date.now();

  const recentEvents = events.filter((event) => {
    const ts = new Date(event.timestamp).getTime();
    return now - ts <= FOURTEEN_DAYS_MS;
  });

  if (recentEvents.length === 0) {
    return {
      message: "Share your profile to increase bookings.",
      ctaLabel: "Share club",
      variant: "info",
    };
  }

  const socialShares = recentEvents.filter((e) => e.type === "social_share");
  if (socialShares.length === 0 && events.length > 0) {
    return {
      message: "Try sharing on WhatsApp or Facebook to reach more families.",
      ctaLabel: "Share now",
      variant: "info",
    };
  }

  return null;
}

export function hasRecentShareActivity(): boolean {
  return getSharePrompt() === null;
}
