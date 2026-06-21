"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { RegisterQrModal } from "@/components/club/registers/RegisterQrModal";
import {
  ACTIVITY_STATUS_LABELS,
  type ActivityRow,
} from "@/lib/club-activities";
import { getActiveWaitlistCount } from "@/lib/waitlist/storage";
import { imageStorage } from "@/lib/image-storage";
import { ActivityCardMenu } from "./ActivityCardMenu";
import { ActivityCommunicationsModal } from "./ActivityCommunicationsModal";
import { ActivityWaitingListModal } from "./ActivityWaitingListModal";

const STATUS_STYLES = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  archived: "bg-amber-50 text-amber-800 ring-amber-200",
  full: "bg-violet-50 text-violet-700 ring-violet-200",
} as const;

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

function getOccupancyTone(percent: number): "green" | "amber" | "red" {
  if (percent >= 80) return "green";
  if (percent >= 50) return "amber";
  return "red";
}

type ActivityCardProps = {
  row: ActivityRow;
  selected: boolean;
  onSelectToggle: () => void;
  onVisibilityToggle: (row: ActivityRow) => void;
  onPreview: (row: ActivityRow) => void;
  onShareActivity: (row: ActivityRow) => void;
  onShareClub: () => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
  onToast: (message: string) => void;
};

export function ActivityCard({
  row,
  selected,
  onSelectToggle,
  onVisibilityToggle,
  onPreview,
  onShareActivity,
  onShareClub,
  onArchive,
  onDelete,
  onToast,
}: ActivityCardProps) {
  const router = useRouter();
  const [commsOpen, setCommsOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const imageUrl = imageStorage.getPreviewUrl(row.imageId);
  const waitlistCount = getActiveWaitlistCount(row.id);
  const occupancyTone = getOccupancyTone(row.occupancy.percent);
  const dotClass =
    occupancyTone === "green"
      ? "bg-emerald-500"
      : occupancyTone === "amber"
        ? "bg-amber-500"
        : "bg-rose-500";

  function handleRegister() {
    router.push(`/club/registers?session=${row.id}`);
  }

  return (
    <>
      <article
        className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
          selected ? "border-teal-400 ring-2 ring-teal-100" : "border-zinc-200/80"
        }`}
      >
        <div className="relative aspect-[16/10] bg-gradient-to-br from-zinc-100 via-zinc-50 to-teal-50">
          {imageUrl ? (
            <SafeImage
              src={imageUrl}
              alt={row.title}
              fill
              className="object-cover"
            />
          ) : null}

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelectToggle}
              aria-label={`Select ${row.title}`}
              className="h-4 w-4 rounded border-zinc-300 bg-white text-teal-600 shadow-sm focus:ring-teal-500"
            />
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset shadow-sm ${STATUS_STYLES[row.status]}`}
            >
              {ACTIVITY_STATUS_LABELS[row.status]}
            </span>
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {row.visibility ? "Visible" : "Hidden"}
            </span>
            <button
              type="button"
              onClick={() => onVisibilityToggle(row)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                row.visibility ? "bg-emerald-500" : "bg-zinc-300"
              }`}
              aria-label={`Toggle visibility for ${row.title}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  row.visibility ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-zinc-900">{row.title}</h3>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              {row.tags
                .filter((tag) => tag === "Card payments" || tag === "Direct Debit")
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700"
                  >
                    {tag}
                  </span>
                ))}
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                {row.ageRange}
              </span>
            </div>
          </div>

          <dl className="mt-3 space-y-1.5 text-sm text-zinc-600">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Date range</dt>
              <dd className="text-right font-medium text-zinc-800">
                {formatDateRange(row.startDate, row.endDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Time</dt>
              <dd className="font-medium text-zinc-800">{row.timeRange}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Venue</dt>
              <dd className="truncate text-right font-medium text-zinc-800">
                {row.venueName}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-500">Occupancy</dt>
              <dd className="flex items-center gap-1.5 font-medium text-zinc-800">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                {row.occupancy.filled}/{row.occupancy.capacity} (
                {row.occupancy.percent}%)
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Reviews</dt>
              <dd className="font-medium text-zinc-800">
                {row.reviews.count === 0
                  ? "No reviews yet"
                  : `${row.reviews.rating.toFixed(1)} ★ (${row.reviews.count})`}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Waiting list</dt>
              <dd className="font-medium text-zinc-800">{waitlistCount}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRegister}
                className="min-h-11 rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setCommsOpen(true)}
                className="min-h-11 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Communications
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWaitlistOpen(true)}
                className="min-h-10 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Waiting list ({waitlistCount})
              </button>
              <ActivityCardMenu
                row={row}
                onPreview={onPreview}
                onShareActivity={onShareActivity}
                onShareClub={onShareClub}
                onArchive={onArchive}
                onDelete={onDelete}
                onCreateQr={() => setQrOpen(true)}
              />
            </div>
          </div>
        </div>
      </article>

      <ActivityCommunicationsModal
        row={row}
        open={commsOpen}
        onClose={() => setCommsOpen(false)}
        onToast={onToast}
      />

      <ActivityWaitingListModal
        row={row}
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        onToast={onToast}
      />

      <RegisterQrModal
        activityId={row.id}
        activityTitle={row.title}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </>
  );
}
