"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  ACTIVITY_STATUS_LABELS,
  type ActivityStatus,
} from "@/lib/club-activities";
import {
  buildParentMailto,
  copyContactEmails,
  copyContactPhones,
  getBookedParentContacts,
  getWaitlistParentContacts,
  type RegisterActivityCardData,
} from "@/lib/club-registers";
import { imageStorage } from "@/lib/image-storage";

const STATUS_STYLES: Record<ActivityStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  archived: "bg-amber-50 text-amber-800 ring-amber-200",
  full: "bg-violet-50 text-violet-700 ring-violet-200",
};

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) {
    return "—";
  }

  if (start && end && start !== end) {
    return `${formatDateLabel(start)} – ${formatDateLabel(end)}`;
  }

  return formatDateLabel(start ?? end);
}

type RegisterActivityCardProps = {
  card: RegisterActivityCardData;
  onCreateQr: (card: RegisterActivityCardData) => void;
  onToast: (message: string) => void;
};

const actionClass =
  "rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

export function RegisterActivityCard({
  card,
  onCreateQr,
  onToast,
}: RegisterActivityCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const imageUrl = card.imageId
    ? imageStorage.getPreviewUrl(card.imageId)
    : null;

  const statusLabel = card.isExample
    ? "Example activity"
    : ACTIVITY_STATUS_LABELS[card.status];
  const statusStyle = card.isExample
    ? "bg-sky-50 text-sky-800 ring-sky-200"
    : STATUS_STYLES[card.status];

  function handleViewRegister() {
    router.push(`/club/registers?session=${card.id}`);
  }

  function handleContactParents() {
    const contacts = getBookedParentContacts(card.id);
    if (contacts.length === 0) {
      onToast(
        card.isExample
          ? "Example register — no parent contacts to message."
          : "No booked parents to message yet.",
      );
      return;
    }

    const mailto = buildParentMailto(
      contacts,
      `${card.title} — message from your club`,
      `Hello,\n\nThis is a message regarding ${card.title}.\n\n`,
    );
    window.location.href = mailto;
  }

  function handleContactWaitlist() {
    const contacts = getWaitlistParentContacts(card.id);
    if (contacts.length === 0) {
      onToast(
        card.isExample
          ? "Example register — no waiting list contacts."
          : "No one on the waiting list yet.",
      );
      return;
    }

    const mailto = buildParentMailto(
      contacts,
      `${card.title} — waiting list update`,
      `Hello,\n\nThis is an update about your place on the waiting list for ${card.title}.\n\n`,
    );
    window.location.href = mailto;
  }

  async function handleCopyEmails() {
    const booked = getBookedParentContacts(card.id);
    const value = copyContactEmails(booked);
    if (!value) {
      onToast(
        card.isExample
          ? "Example register — no parent emails to copy."
          : "No parent emails to copy yet.",
      );
      return;
    }

    await navigator.clipboard.writeText(value);
    onToast("Parent emails copied.");
  }

  async function handleCopyPhones() {
    const booked = getBookedParentContacts(card.id);
    const value = copyContactPhones(booked);
    if (!value) {
      onToast(
        card.isExample
          ? "Example register — no parent phone numbers to copy."
          : "No parent phone numbers to copy yet.",
      );
      return;
    }

    await navigator.clipboard.writeText(value);
    onToast("Parent phone numbers copied.");
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-zinc-100 via-zinc-50 to-teal-50">
        {imageUrl ? (
          <SafeImage
            src={imageUrl}
            alt={card.title}
            fill
            className="object-cover"
          />
        ) : null}
        {card.isExample ? (
          <span className="absolute left-3 top-3 rounded-full bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            Example activity
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-zinc-900">{card.title}</h3>
          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
            {card.ageRange}
          </span>
        </div>

        <dl className="mt-3 space-y-1.5 text-sm text-zinc-600">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Date range</dt>
            <dd className="text-right font-medium text-zinc-800">
              {formatDateRange(card.startDate, card.endDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Time</dt>
            <dd className="font-medium text-zinc-800">{card.timeRange}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Venue</dt>
            <dd className="truncate text-right font-medium text-zinc-800">
              {card.venueName}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Occupancy</dt>
            <dd className="font-medium text-zinc-800">
              {card.occupancy.filled}/{card.occupancy.capacity} (
              {card.occupancy.percent}%)
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">Status</dt>
            <dd>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusStyle}`}
              >
                {statusLabel}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Next session</dt>
            <dd className="font-medium text-zinc-800">
              {formatDateLabel(card.upcomingSessionDate)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
          <button
            type="button"
            onClick={handleViewRegister}
            className="min-h-11 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            View register
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="min-h-10 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              aria-expanded={menuOpen}
            >
              More actions
            </button>

            {menuOpen ? (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                <div className="grid gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onCreateQr(card);
                    }}
                    className={actionClass}
                  >
                    Create QR code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleContactParents();
                    }}
                    className={actionClass}
                  >
                    Contact parents/carers
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleContactWaitlist();
                    }}
                    className={actionClass}
                  >
                    Contact waiting list
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleCopyEmails();
                    }}
                    className={actionClass}
                  >
                    Copy parent emails
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleCopyPhones();
                    }}
                    className={actionClass}
                  >
                    Copy parent phone numbers
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
