"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getMessagesForThread } from "@/lib/support";
import type { InboxItem } from "@/lib/inbox";
import { openSupportDrawer } from "@/lib/inbox";

type InboxDetailPanelProps = {
  item: InboxItem;
  onArchive: () => void;
  onClose: () => void;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailActions({ item }: { item: InboxItem }) {
  if (item.href) {
    return (
      <Link
        href={item.href}
        className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
      >
        View details
      </Link>
    );
  }
  return null;
}

function MessageThreadPreview({ threadId }: { threadId: string }) {
  const messages = useMemo(
    () => getMessagesForThread(threadId),
    [threadId],
  );

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
      {messages.length === 0 ? (
        <p className="text-sm text-zinc-500">No messages in this thread yet.</p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.sender_type === "user"
                ? "ml-4 bg-white text-zinc-800 shadow-sm"
                : "mr-4 bg-teal-50 text-teal-900"
            }`}
          >
            <p className="text-xs font-semibold text-zinc-500">
              {msg.sender_name}
            </p>
            <p className="mt-1 leading-6">{msg.body}</p>
          </div>
        ))
      )}
      <button
        type="button"
        onClick={() => openSupportDrawer({ threadId })}
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
      >
        Open in Support Centre →
      </button>
    </div>
  );
}

function ReviewDetail({ item }: { item: InboxItem }) {
  const rating = item.metadata?.rating;
  return (
    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
      {typeof rating === "number" ? (
        <p className="text-lg font-semibold text-amber-800">
          {"★".repeat(rating)}
          {"☆".repeat(5 - rating)}
          <span className="ml-2 text-sm font-medium text-amber-700">
            {rating}/5
          </span>
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-zinc-700">{item.body}</p>
    </div>
  );
}

function PaymentDetail({ item }: { item: InboxItem }) {
  const amount = item.metadata?.amount;
  const currency = item.metadata?.currency ?? "GBP";
  return (
    <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
      {typeof amount === "number" ? (
        <p className="text-2xl font-bold text-zinc-900">
          {currency === "GBP" ? "£" : ""}
          {amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
    </div>
  );
}

export function InboxDetailPanel({
  item,
  onArchive,
  onClose,
}: InboxDetailPanelProps) {
  return (
    <div className="flex h-full flex-col border-l border-zinc-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {item.category}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900">{item.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {formatDateTime(item.timestamp)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
          aria-label="Close detail"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {item.type === "message" && item.threadId ? (
          <MessageThreadPreview threadId={item.threadId} />
        ) : item.type === "review" ? (
          <ReviewDetail item={item} />
        ) : item.type === "payment" ? (
          <PaymentDetail item={item} />
        ) : (
          <p className="text-sm leading-7 text-zinc-700">
            {item.body ?? item.preview}
          </p>
        )}

        {item.priority === "high" ? (
          <span className="mt-4 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            High priority
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-5 py-4">
        <DetailActions item={item} />
        {item.type === "message" && item.threadId ? (
          <button
            type="button"
            onClick={() => openSupportDrawer({ threadId: item.threadId })}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Reply in chat
          </button>
        ) : null}
        <button
          type="button"
          onClick={onArchive}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
