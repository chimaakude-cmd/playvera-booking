import { BOOKING_DRAFT_STORAGE_PREFIX } from "./constants";
import type { BookingFlowDraft } from "./types";
import { emptyBookingDetails } from "./types";

function draftKey(sessionId: string): string {
  return `${BOOKING_DRAFT_STORAGE_PREFIX}${sessionId}`;
}

export function loadBookingDraft(sessionId: string): BookingFlowDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(draftKey(sessionId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as BookingFlowDraft;
  } catch {
    return null;
  }
}

export function saveBookingDraft(draft: BookingFlowDraft): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(draftKey(draft.sessionId), JSON.stringify(draft));
}

export function clearBookingDraft(sessionId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(draftKey(sessionId));
}

export function createInitialDraft(sessionId: string): BookingFlowDraft {
  return {
    sessionId,
    accessMode: "guest",
    details: emptyBookingDetails(),
    questionValues: {},
    currentStep: 1,
  };
}
