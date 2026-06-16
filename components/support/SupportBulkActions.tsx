"use client";

type SupportBulkActionsProps = {
  selectMode: boolean;
  selectedCount: number;
  onToggleSelectMode: () => void;
  onArchiveSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
};

export function SupportBulkActions({
  selectMode,
  selectedCount,
  onToggleSelectMode,
  onArchiveSelected,
  onDeleteSelected,
  onClearSelection,
}: SupportBulkActionsProps) {
  if (!selectMode) {
    return (
      <button
        type="button"
        onClick={onToggleSelectMode}
        className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-700"
      >
        Select
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-medium text-zinc-600">
        {selectedCount} selected
      </span>
      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onArchiveSelected}
        className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 disabled:opacity-40"
      >
        Archive
      </button>
      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onDeleteSelected}
        className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 disabled:opacity-40"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => {
          onClearSelection();
          onToggleSelectMode();
        }}
        className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-600"
      >
        Cancel
      </button>
    </div>
  );
}
