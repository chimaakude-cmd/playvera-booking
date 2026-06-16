import type { ClubSession } from "@/lib/sessions";
import { formatDay, formatTimeRange } from "@/lib/sessions";
import {
  createSessionFullAlert,
  createWaitlistGrowthAlert,
} from "./provider-alerts";
import {
  getServerWaitlistEntriesForSession,
  getServerWaitlistEntry,
  reserveSpot,
  releaseSpot,
  updateServerWaitlistEntry,
} from "./server-store";
import { logWaitlistInviteEmail } from "./emails";
import type { WaitlistEntry } from "./types";
import { WAITLIST_INVITE_DURATION_MS } from "./types";

function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function getActiveInviteForSession(sessionId: string): WaitlistEntry | null {
  return (
    getServerWaitlistEntriesForSession(sessionId).find(
      (entry) =>
        entry.status === "INVITED_TO_BOOK" || entry.status === "PAYMENT_PENDING",
    ) ?? null
  );
}

function getFirstPendingEntry(sessionId: string): WaitlistEntry | null {
  return (
    getServerWaitlistEntriesForSession(sessionId)
      .filter((entry) => entry.status === "WAITLIST_PENDING")
      .sort((a, b) => a.position - b.position)[0] ?? null
  );
}

export function expireStaleInvitations(sessionId: string): WaitlistEntry[] {
  const now = Date.now();
  const expired: WaitlistEntry[] = [];

  for (const entry of getServerWaitlistEntriesForSession(sessionId)) {
    if (
      (entry.status === "INVITED_TO_BOOK" ||
        entry.status === "PAYMENT_PENDING") &&
      entry.inviteExpiresAt &&
      new Date(entry.inviteExpiresAt).getTime() <= now
    ) {
      const updated = updateServerWaitlistEntry(entry.id, {
        status: "EXPIRED",
        inviteToken: null,
        inviteExpiresAt: null,
      });
      if (updated) {
        releaseSpot(sessionId);
        expired.push(updated);
      }
    }
  }

  return expired;
}

export type InviteResult = {
  entry: WaitlistEntry;
  bookingLink: string;
  emailSent: boolean;
};

export function inviteNextWaitlistEntry(
  session: ClubSession,
  baseUrl: string,
): InviteResult | null {
  expireStaleInvitations(session.id);

  if (getActiveInviteForSession(session.id)) {
    return null;
  }

  const next = getFirstPendingEntry(session.id);
  if (!next) {
    return null;
  }

  const inviteToken = generateInviteToken();
  const inviteExpiresAt = new Date(
    Date.now() + WAITLIST_INVITE_DURATION_MS,
  ).toISOString();

  const updated = updateServerWaitlistEntry(next.id, {
    status: "INVITED_TO_BOOK",
    inviteToken,
    inviteExpiresAt,
  });

  if (!updated) {
    return null;
  }

  reserveSpot(session.id);

  const bookingLink = `${baseUrl}/book/invite/${inviteToken}`;
  logWaitlistInviteEmail(updated.email, {
    parentName: updated.parentName,
    childName: updated.childName,
    sessionTitle: session.sessionTitle,
    sessionDate: formatDay(session.day),
    sessionTime: formatTimeRange(session.startTime, session.endTime),
    clubName: session.location || "Activora Club",
    bookingLink,
    expiresAt: inviteExpiresAt,
  });

  return { entry: updated, bookingLink, emailSent: true };
}

export function processWaitlistOnSpaceAvailable(
  session: ClubSession,
  baseUrl: string,
): InviteResult | null {
  expireStaleInvitations(session.id);
  return inviteNextWaitlistEntry(session, baseUrl);
}

export function markWaitlistPaymentPending(entryId: string): WaitlistEntry | null {
  return updateServerWaitlistEntry(entryId, { status: "PAYMENT_PENDING" });
}

export function markWaitlistBooked(entryId: string): WaitlistEntry | null {
  const entry = getServerWaitlistEntry(entryId);
  if (!entry) {
    return null;
  }
  releaseSpot(entry.sessionId);
  return updateServerWaitlistEntry(entryId, {
    status: "BOOKED",
    inviteToken: null,
    inviteExpiresAt: null,
  });
}

export function declineWaitlistInvite(entryId: string): WaitlistEntry | null {
  const entry = getServerWaitlistEntry(entryId);
  if (!entry) {
    return null;
  }
  releaseSpot(entry.sessionId);
  const updated = updateServerWaitlistEntry(entryId, {
    status: "DECLINED",
    inviteToken: null,
    inviteExpiresAt: null,
  });
  return updated;
}

export function notifyProviderOnWaitlistJoin(params: {
  session: ClubSession;
  isSessionFull: boolean;
  waitlistCount: number;
}): void {
  if (params.isSessionFull && params.waitlistCount === 1) {
    createSessionFullAlert({
      sessionId: params.session.id,
      sessionTitle: params.session.sessionTitle,
      waitlistCount: params.waitlistCount,
    });
  }

  if (params.waitlistCount > 0 && params.waitlistCount % 3 === 0) {
    createWaitlistGrowthAlert({
      sessionId: params.session.id,
      sessionTitle: params.session.sessionTitle,
      waitlistCount: params.waitlistCount,
    });
  }
}

export function getWaitlistPosition(entry: WaitlistEntry): number {
  const pending = getServerWaitlistEntriesForSession(entry.sessionId)
    .filter((item) => item.status === "WAITLIST_PENDING")
    .sort((a, b) => a.position - b.position);

  const index = pending.findIndex((item) => item.id === entry.id);
  return index === -1 ? entry.position : index + 1;
}
