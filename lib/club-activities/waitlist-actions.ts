import { getActivityPublicUrl } from "@/lib/club-share/url";
import {
  getWaitlistEntriesForSession,
  updateWaitlistEntry,
} from "@/lib/waitlist/storage";
import { WAITLIST_INVITE_DURATION_MS } from "@/lib/waitlist/types";
import type { ClubSession } from "@/lib/sessions";
import type { WaitlistEntry } from "@/lib/waitlist/types";

export type OfferPlaceResult = {
  entry: WaitlistEntry;
  bookingLink: string;
};

function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function getNextPendingWaitlistEntry(
  sessionId: string,
): WaitlistEntry | null {
  return (
    getWaitlistEntriesForSession(sessionId)
      .filter((entry) => entry.status === "WAITLIST_PENDING")
      .sort((a, b) => a.position - b.position)[0] ?? null
  );
}

export function hasActiveWaitlistInvite(sessionId: string): boolean {
  return getWaitlistEntriesForSession(sessionId).some(
    (entry) =>
      entry.status === "INVITED_TO_BOOK" || entry.status === "PAYMENT_PENDING",
  );
}

export function offerPlaceToNextOnWaitlist(
  session: ClubSession,
): OfferPlaceResult | null {
  if (hasActiveWaitlistInvite(session.id)) {
    return null;
  }

  const next = getNextPendingWaitlistEntry(session.id);
  if (!next) {
    return null;
  }

  const inviteToken = generateInviteToken();
  const inviteExpiresAt = new Date(
    Date.now() + WAITLIST_INVITE_DURATION_MS,
  ).toISOString();

  const updated = updateWaitlistEntry(next.id, {
    status: "INVITED_TO_BOOK",
    inviteToken,
    inviteExpiresAt,
  });

  if (!updated || !inviteToken) {
    return null;
  }

  const bookingLink = `${window.location.origin}/book/invite/${inviteToken}`;
  return { entry: updated, bookingLink };
}

export function getActivityBookingInviteLink(activityId: string): string {
  return getActivityPublicUrl(activityId);
}
