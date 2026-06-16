"use client";

type SupportEscalationProps = {
  onTransfer: () => void;
  onKeepChatting: () => void;
};

export function SupportEscalation({
  onTransfer,
  onKeepChatting,
}: SupportEscalationProps) {
  return (
    <div className="mx-4 mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-900">
        Would you like to speak with a human?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onTransfer}
          className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
        >
          Transfer to human
        </button>
        <button
          type="button"
          onClick={onKeepChatting}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Keep chatting
        </button>
      </div>
    </div>
  );
}
