"use client";

import Link from "next/link";
import { useState } from "react";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { paginateItems } from "@/lib/pagination";
import type { ParentReply } from "@/lib/club-communications";

type ParentRepliesInboxProps = {
  replies: ParentReply[];
  canReply: boolean;
  onMarkResolved: (id: string) => void;
  onAssignReply: (id: string) => void;
};

function statusTone(status: ParentReply["status"]) {
  if (status === "open") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (status === "resolved") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-zinc-100 text-zinc-600 ring-zinc-200";
}

function formatReplyTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ParentRepliesInbox({
  replies,
  canReply,
  onMarkResolved,
  onAssignReply,
}: ParentRepliesInboxProps) {
  const [page, setPage] = useState(1);
  const pagination = paginateItems(replies, page, 5);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3">Parent / child</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Last message</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pagination.items.map((reply) => (
              <tr key={reply.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{reply.parentName}</p>
                  <p className="text-xs text-zinc-500">{reply.childName}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">{reply.activity}</td>
                <td className="px-4 py-3">
                  <p className="max-w-xs text-zinc-700">{reply.lastMessage}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {formatReplyTime(reply.lastMessageAt)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusTone(reply.status)}`}
                  >
                    {reply.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">{reply.assignedStaff}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {canReply ? (
                      <button
                        type="button"
                        onClick={() => onAssignReply(reply.id)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Reply
                      </button>
                    ) : null}
                    {canReply && reply.status !== "resolved" ? (
                      <button
                        type="button"
                        onClick={() => onMarkResolved(reply.id)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Mark resolved
                      </button>
                    ) : null}
                    {reply.bookingId ? (
                      <Link
                        href={`/club/bookings?booking=${reply.bookingId}`}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                      >
                        Link to booking
                      </Link>
                    ) : null}
                    {reply.customerEmail ? (
                      <Link
                        href={`/club/customers?email=${encodeURIComponent(reply.customerEmail)}`}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                      >
                        View profile
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={setPage}
      />
    </div>
  );
}
