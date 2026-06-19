"use client";

import { useEffect, useState } from "react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { getClubProfile } from "@/lib/club-profile";
import {
  downloadDataUrl,
  getQrDataUrl,
  openPrintView,
} from "@/lib/club-share";
import { getActivityBookingUrl } from "@/lib/club-registers";

type RegisterQrModalProps = {
  activityId: string;
  activityTitle: string;
  open: boolean;
  onClose: () => void;
};

export function RegisterQrModal({
  activityId,
  activityTitle,
  open,
  onClose,
}: RegisterQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const profile = getClubProfile();
  const bookingUrl = getActivityBookingUrl(activityId);

  useModalDismiss(open, onClose);

  useEffect(() => {
    if (!open) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void getQrDataUrl(bookingUrl, profile?.logoUrl)
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, bookingUrl, profile?.logoUrl]);

  if (!open) {
    return null;
  }

  function handleDownload() {
    if (!qrDataUrl) {
      return;
    }
    downloadDataUrl(qrDataUrl, `${activityId}-booking-qr.png`);
  }

  function handlePrint() {
    if (!qrDataUrl) {
      return;
    }
    openPrintView(
      qrDataUrl,
      profile?.clubName ?? activityTitle,
      bookingUrl,
    );
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(bookingUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close QR code modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="register-qr-title"
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="register-qr-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Booking QR code
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{activityTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-500 hover:bg-zinc-50"
          >
            ✕
          </button>
        </div>

        <p className="mt-4 text-sm text-zinc-600">
          Parents can scan this code to open the public booking page for this
          activity.
        </p>

        <div className="mt-5 flex justify-center rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
          {loading ? (
            <div className="flex h-48 w-48 items-center justify-center text-sm text-zinc-500">
              Generating QR…
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${activityTitle}`}
              className="h-48 w-48"
            />
          ) : (
            <p className="text-sm text-rose-600">Could not generate QR code.</p>
          )}
        </div>

        <p className="mt-4 break-all rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          {bookingUrl}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Download
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!qrDataUrl}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Print
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
