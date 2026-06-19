"use client";

import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import {
  buildParentMailto,
  buildSmsLink,
  copyContactEmails,
  copyContactPhones,
  exportContactsCsv,
  getBookedParentContacts,
  getWaitlistParentContacts,
} from "@/lib/club-registers";
import type { ActivityRow } from "@/lib/club-activities";

type ActivityCommunicationsModalProps = {
  row: ActivityRow;
  open: boolean;
  onClose: () => void;
  onToast: (message: string) => void;
};

const actionClass =
  "rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

export function ActivityCommunicationsModal({
  row,
  open,
  onClose,
  onToast,
}: ActivityCommunicationsModalProps) {
  useModalDismiss(open, onClose);

  if (!open) {
    return null;
  }

  const bookedContacts = getBookedParentContacts(row.id);
  const waitlistContacts = getWaitlistParentContacts(row.id);

  function handleContactBooked() {
    if (bookedContacts.length === 0) {
      onToast("No booked parents to message yet.");
      return;
    }

    const mailto = buildParentMailto(
      bookedContacts,
      `${row.title} — message from your club`,
      `Hello,\n\nThis is a message regarding ${row.title}.\n\n`,
    );
    window.location.href = mailto;
  }

  function handleContactWaitlist() {
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

  async function handleCopyEmails() {
    const value = copyContactEmails(bookedContacts);
    if (!value) {
      onToast("No parent emails to copy yet.");
      return;
    }

    await navigator.clipboard.writeText(value);
    onToast("Parent emails copied.");
  }

  async function handleCopyPhones() {
    const value = copyContactPhones(bookedContacts);
    if (!value) {
      onToast("No parent phone numbers to copy yet.");
      return;
    }

    await navigator.clipboard.writeText(value);
    onToast("Parent phone numbers copied.");
  }

  function handleSendEmail() {
    handleContactBooked();
  }

  function handleSendSms() {
    const sms = buildSmsLink(
      bookedContacts,
      `Hello,\n\nThis is a message regarding ${row.title}.\n\n`,
    );
    if (!sms) {
      onToast("No parent phone numbers available.");
      return;
    }
    window.location.href = sms;
  }

  function handleExportContacts() {
    if (bookedContacts.length === 0) {
      onToast("No contacts to export yet.");
      return;
    }

    const csv = exportContactsCsv(bookedContacts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.title.replace(/\s+/g, "-").toLowerCase()}-contacts.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onToast("Contacts exported.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Close communications modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-comms-title"
        className="relative w-full max-w-md rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="activity-comms-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Communications
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{row.title}</p>
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
          <button type="button" onClick={handleContactBooked} className={actionClass}>
            Contact all booked parents
          </button>
          <button
            type="button"
            onClick={handleContactWaitlist}
            className={actionClass}
          >
            Contact waiting list
          </button>
          <button
            type="button"
            onClick={() => void handleCopyEmails()}
            className={actionClass}
          >
            Copy all parent emails
          </button>
          <button
            type="button"
            onClick={() => void handleCopyPhones()}
            className={actionClass}
          >
            Copy all parent phone numbers
          </button>
          <button type="button" onClick={handleSendEmail} className={actionClass}>
            Send email
          </button>
          <button type="button" onClick={handleSendSms} className={actionClass}>
            Send SMS
          </button>
          <button
            type="button"
            onClick={handleExportContacts}
            className={actionClass}
          >
            Export contacts
          </button>
        </div>
      </div>
    </div>
  );
}
