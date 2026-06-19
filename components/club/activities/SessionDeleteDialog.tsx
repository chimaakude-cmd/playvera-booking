"use client";

type SessionDeleteDialogProps = {
  open: boolean;
  title: string;
  hasBookings: boolean;
  confirmLabel?: string;
  loading?: boolean;
  onConfirmDelete: () => void;
  onArchiveInstead: () => void;
  onCancel: () => void;
};

export function SessionDeleteDialog({
  open,
  title,
  hasBookings,
  confirmLabel = "Delete Session",
  loading = false,
  onConfirmDelete,
  onArchiveInstead,
  onCancel,
}: SessionDeleteDialogProps) {
  if (!open) {
    return null;
  }

  const description = hasBookings
    ? "This session has existing bookings. Please archive it instead so booking history is kept."
    : "This action cannot be undone.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {hasBookings ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onArchiveInstead}
                disabled={loading}
                className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
              >
                {loading ? "Archiving..." : "Archive Instead"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "Deleting..." : confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
