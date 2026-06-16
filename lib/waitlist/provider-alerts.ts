import type { Notification } from "@/lib/notifications/types";

const providerAlerts: Notification[] = [];

export function createSessionFullAlert(params: {
  sessionId: string;
  sessionTitle: string;
  waitlistCount: number;
}): Notification {
  const alert: Notification = {
    id: `waitlist_full_${params.sessionId}_${Date.now()}`,
    type: "waitlist",
    title: "Session reached capacity",
    body: `${params.sessionTitle} is now full.${params.waitlistCount > 0 ? ` ${params.waitlistCount} families on the waitlist.` : ""}`,
    href: `/club/activities`,
    read: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  providerAlerts.push(alert);
  return alert;
}

export function createWaitlistGrowthAlert(params: {
  sessionId: string;
  sessionTitle: string;
  waitlistCount: number;
}): Notification {
  const alert: Notification = {
    id: `waitlist_growth_${params.sessionId}_${Date.now()}`,
    type: "waitlist",
    title: "Waitlist growing",
    body: `${params.waitlistCount} families are waiting for ${params.sessionTitle}.`,
    href: `/club/activities`,
    read: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  providerAlerts.push(alert);
  return alert;
}

export function getProviderWaitlistAlerts(): Notification[] {
  return [...providerAlerts];
}

export function clearProviderWaitlistAlerts(): void {
  providerAlerts.length = 0;
}
