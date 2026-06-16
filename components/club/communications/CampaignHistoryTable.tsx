"use client";

import type { ClubCampaign, CampaignHistoryStatus } from "@/lib/club-communications/campaigns";
import { formatCampaignDate } from "@/lib/club-communications/campaigns";

type CampaignHistoryTableProps = {
  campaigns: ClubCampaign[];
};

function statusTone(status: CampaignHistoryStatus): string {
  if (status === "sent") {
    return "bg-teal-50 text-teal-700";
  }

  if (status === "scheduled") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-zinc-100 text-zinc-600";
}

function statusLabel(status: CampaignHistoryStatus): string {
  if (status === "sent") {
    return "Sent";
  }

  if (status === "scheduled") {
    return "Scheduled";
  }

  return "Cancelled";
}

export function CampaignHistoryTable({ campaigns }: CampaignHistoryTableProps) {
  if (campaigns.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No campaigns sent yet. Create your first campaign above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200/80">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Audience</th>
            <th className="px-4 py-3">Sent date</th>
            <th className="px-4 py-3">Delivered</th>
            <th className="px-4 py-3">Open rate</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {campaigns.map((campaign) => {
            const sentDate =
              campaign.status === "scheduled"
                ? formatCampaignDate(campaign.scheduledAt)
                : formatCampaignDate(campaign.sentAt);

            return (
              <tr key={campaign.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {campaign.name}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600">
                  {campaign.audience}
                </td>
                <td className="px-4 py-3 text-zinc-600">{sentDate}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {campaign.status === "sent"
                    ? campaign.delivered.toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {campaign.status === "sent" ? `${campaign.openRate}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(campaign.status)}`}
                  >
                    {statusLabel(campaign.status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
