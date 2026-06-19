"use client";

import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import {
  offerPlaceToNextOnWaitlist,
  getActivityBookingInviteLink,
} from "@/lib/club-activities/waitlist-actions";
import type { ActivityRow } from "@/lib/club-activities";
import {
  buildParentMailto,
  getWaitlistParentContacts,
} from "@/lib/club-registers";
import { getActiveWaitlistCount } from "@/lib/waitlist/storage";

type ActivityWaitingListModalProps = {
  row: ActivityRow;
  open: boolean;
  onClose: () => void;
  onToast: (message: string) => void;
};

const actionClass =
  "rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

export function ActivityWaitingListModal({
  row,
  open,
  onClose,
  onToast,
}: ActivityWaitingListModalProps) {
  useModalDismiss(open, onClose);

  if (!open) {
    return null;
  }

  const waitlistCount = getActiveWaitlistCount(row.id);
  const waitlistContacts = getWaitlistParentContacts(row.id);

  function handleContactAll() {
    if (waitlistContacts.length === 0) {
      onToast("No one on the waiting list yet.");
      return;
    }

    const mailto = buildParentMailto(
      waitlistContacts,
      `${row.title} — waiting list update`,
      `Hello,\n\nThis is an update about your place on the waiting list for ${row.title}.\n\n`,
    );
    window.location.href = mailto;
  }

  function handleOfferPlace() {
    const result = offerPlaceToNextOnWaitlist(row.session);
    if (!result) {
      onToast(
        waitlistCount === 0
          ? "No families on the waiting list."
          : "A booking invite is already active for this activity.",
      );
      return;
    }

    onToast(
      `Place offered to ${result.entry.parentName}. Booking link copied to clipboard.`,
    );
    void navigator.clipboard.writeText(result.bookingLink);
  }

  function handleSendBookingInvite() {
    const bookingLink = getActivityBookingInviteLink(row.id);
    if (waitlistContacts.length === 0) {
      onToast("No waiting list contacts to invite.");
      return;
    }

    const mailto = buildParentMailto(
      waitlistContacts,
      `${row.title} — booking invite`,
      `Hello,\n\nA place may be available for ${row.title}. Book here:\n${bookingLink}\n\n`,
    );
    window.location.href = mailto;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Close waiting list modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-waitlist-title"
        className="relative w-full max-w-md rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="activity-waitlist-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Waiting list
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {waitlistCount} famil{waitlistCount === 1 ? "y" : "ies"} waiting
              for {row.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-500 hover:bg-zinc-50"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          <button type="button" onClick={handleContactAll} className={actionClass}>
            Contact all
          </button>
          <button type="button" onClick={handleOfferPlace} className={actionClass}>
            Offer place
          </button>
          <button
            type="button"
            onClick={handleSendBookingInvite}
            className={actionClass}
          >
            Send booking invite
          </button>
        </div>
      </div>
    </div>
  );
}
