"use client";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-zinc-500">
        Showing {startIndex}–{endIndex} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-zinc-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
