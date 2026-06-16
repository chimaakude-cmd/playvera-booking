"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { DashboardSection } from "@/components/club/dashboard/DashboardCards";
import {
  OrgActionLink,
  OrgFilterField,
  OrgFilterPanel,
  OrgStatusBadge,
  OrgTable,
  OrgTableWrapper,
  OrgToast,
  orgSelectClass,
} from "@/components/organisation/shared/OrgUi";
import {
  DEFAULT_ORG_COMMUNICATIONS_FILTERS,
  filterOrgParentReplies,
  formatOrgDateTime,
  getOrgBroadcasts,
  getOrgCampaigns,
  getOrgCommunicationsFilterOptions,
  getOrgMessageTemplates,
  getOrgParentReplies,
  type OrgBroadcast,
  type OrgCampaign,
  type OrgCommunicationsFilters,
  type OrgMessageTemplate,
  type OrgParentReply,
} from "@/lib/organisation";

export function OrganisationCommunicationsPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrgCommunicationsFilters>(
    DEFAULT_ORG_COMMUNICATIONS_FILTERS,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [templates, setTemplates] = useState<OrgMessageTemplate[]>([]);
  const [replies, setReplies] = useState<OrgParentReply[]>([]);
  const [campaigns, setCampaigns] = useState<OrgCampaign[]>([]);
  const [broadcasts, setBroadcasts] = useState<OrgBroadcast[]>([]);

  const filterOptions = useMemo(
    () => getOrgCommunicationsFilterOptions(replies),
    [replies],
  );

  const filteredReplies = useMemo(
    () => filterOrgParentReplies(replies, filters),
    [replies, filters],
  );

  useEffect(() => {
    setTemplates(getOrgMessageTemplates());
    setReplies(getOrgParentReplies());
    setCampaigns(getOrgCampaigns());
    setBroadcasts(getOrgBroadcasts());
    setLoading(false);
  }, []);

  function updateFilter<K extends keyof OrgCommunicationsFilters>(
    key: K,
    value: OrgCommunicationsFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function stubAction(label: string) {
    setMessage(`${label} (demo action).`);
  }

  if (loading) {
    return <LoadingState message="Loading network communications..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Automated templates, parent replies, campaigns, and network broadcasts."
        action={
          <button
            type="button"
            onClick={() => stubAction("Send network update")}
            className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
          >
            Send network update
          </button>
        }
      />

      <OrgToast message={message} />

      <OrgFilterPanel>
        <OrgFilterField label="Franchisee club">
          <select
            value={filters.clubName}
            onChange={(e) => updateFilter("clubName", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All clubs</option>
            {filterOptions.clubs.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </OrgFilterField>
        <OrgFilterField label="Activity">
          <select
            value={filters.activity}
            onChange={(e) => updateFilter("activity", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All activities</option>
            {filterOptions.activities.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
        </OrgFilterField>
        <OrgFilterField label="Parent type">
          <select
            value={filters.parentType}
            onChange={(e) =>
              updateFilter(
                "parentType",
                e.target.value as OrgCommunicationsFilters["parentType"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="returning">Returning</option>
          </select>
        </OrgFilterField>
        <OrgFilterField label="Booking status">
          <select
            value={filters.bookingStatus}
            onChange={(e) =>
              updateFilter(
                "bookingStatus",
                e.target.value as OrgCommunicationsFilters["bookingStatus"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refund_requested">Refund requested</option>
          </select>
        </OrgFilterField>
      </OrgFilterPanel>

      <DashboardSection
        title="Automated templates"
        description="Standard parent emails used across franchisee clubs."
      >
        <OrgTableWrapper>
          <OrgTable columns={["Template", "Channel", "Trigger", "Last edited", "Status"]}>
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {template.name}
                </td>
                <td className="px-4 py-3 capitalize text-zinc-600">
                  {template.channel}
                </td>
                <td className="px-4 py-3 text-zinc-600">{template.trigger}</td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {formatOrgDateTime(template.lastEdited)}
                </td>
                <td className="px-4 py-3">
                  <OrgStatusBadge
                    label={template.enabled ? "Enabled" : "Disabled"}
                    tone={template.enabled ? "emerald" : "zinc"}
                  />
                </td>
              </tr>
            ))}
          </OrgTable>
        </OrgTableWrapper>
      </DashboardSection>

      <DashboardSection
        title="Parent replies"
        description="Inbox messages from parents across the network."
        action={
          <OrgActionLink onClick={() => stubAction("View all replies")}>
            View replies
          </OrgActionLink>
        }
      >
        {filteredReplies.length === 0 ? (
          <EmptyState
            title="No matching replies"
            description="Try adjusting your filters to see parent messages."
          />
        ) : (
          <OrgTableWrapper>
            <OrgTable
              columns={[
                "Parent",
                "Club",
                "Activity",
                "Subject",
                "Received",
                "Status",
                "Actions",
              ]}
            >
              {filteredReplies.map((reply) => (
                <tr key={reply.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {reply.parentName}
                    <p className="text-xs font-normal text-zinc-500 capitalize">
                      {reply.parentType} parent
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {reply.franchiseeClubName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{reply.activityTitle}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-800">{reply.subject}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                      {reply.preview}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                    {formatOrgDateTime(reply.receivedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <OrgStatusBadge
                      label={reply.status}
                      tone={
                        reply.status === "resolved"
                          ? "emerald"
                          : reply.status === "open"
                            ? "amber"
                            : "sky"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <OrgActionLink onClick={() => stubAction("View reply")}>
                      View
                    </OrgActionLink>
                  </td>
                </tr>
              ))}
            </OrgTable>
          </OrgTableWrapper>
        )}
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Campaigns"
          description="Targeted email campaigns by club or audience."
          action={
            <OrgActionLink onClick={() => stubAction("Send to selected club")}>
              Send to club
            </OrgActionLink>
          }
        >
          <OrgTableWrapper>
            <OrgTable columns={["Campaign", "Club", "Audience", "Open rate", "Status"]}>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {campaign.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {campaign.franchiseeClubName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{campaign.audience}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {campaign.status === "sent" ? `${campaign.openRate}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <OrgStatusBadge
                      label={campaign.status}
                      tone={
                        campaign.status === "sent"
                          ? "emerald"
                          : campaign.status === "scheduled"
                            ? "sky"
                            : "zinc"
                      }
                    />
                  </td>
                </tr>
              ))}
            </OrgTable>
          </OrgTableWrapper>
        </DashboardSection>

        <DashboardSection
          title="Broadcasts"
          description="Head office announcements to clubs or parents."
        >
          <OrgTableWrapper>
            <OrgTable columns={["Title", "Scope", "Recipients", "Sent", "Status"]}>
              {broadcasts.map((broadcast) => (
                <tr key={broadcast.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {broadcast.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{broadcast.scope}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {broadcast.recipientCount > 0
                      ? broadcast.recipientCount
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                    {broadcast.status === "sent"
                      ? formatOrgDateTime(broadcast.sentAt)
                      : "Draft"}
                  </td>
                  <td className="px-4 py-3">
                    <OrgStatusBadge
                      label={broadcast.status}
                      tone={broadcast.status === "sent" ? "emerald" : "amber"}
                    />
                  </td>
                </tr>
              ))}
            </OrgTable>
          </OrgTableWrapper>
        </DashboardSection>
      </div>
    </div>
  );
}
