"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { DashboardSection } from "@/components/club/dashboard/DashboardCards";
import { getCurrentClubRole, roleHasPermission } from "@/lib/club-team";
import {
  getCommunicationsMetrics,
  getParentReplies,
  updateParentReply,
} from "@/lib/club-communications";
import { CampaignsSection } from "./CampaignsSection";
import { ReviewRequestSettings } from "./ReviewRequestSettings";
import { DeliveryChannelsSection } from "./DeliveryChannelsSection";
import { OverviewCards } from "./OverviewCards";
import { PlatformTemplatesSection } from "./PlatformTemplatesSection";
import { ParentRepliesInbox } from "./ParentRepliesInbox";
import { TemplateLibrarySection } from "./TemplateLibrarySection";

export function CommunicationsPage() {
  const role = getCurrentClubRole();
  const canView = roleHasPermission(role, "view_communications");
  const canManage = roleHasPermission(role, "manage_communications");
  const canEditTemplates = canView;
  const canReply = canView;

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "overview" | "template-library" | "templates" | "inbox" | "campaigns"
  >("overview");

  const metrics = useMemo(
    () => getCommunicationsMetrics(),
    [refreshKey],
  );

  const replies = useMemo(() => {
    void refreshKey;
    return getParentReplies();
  }, [refreshKey]);

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Communications"
          description="Automated emails, templates, and parent message inbox."
        />
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Access restricted</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
            Your role does not include access to club communications. Contact a
            manager or owner if you need inbox or template access.
          </p>
          <Link
            href="/club/dashboard"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  function handleMarkResolved(id: string) {
    updateParentReply(id, { status: "resolved" });
    setRefreshKey((current) => current + 1);
  }

  function handleAssignReply(id: string) {
    updateParentReply(id, {
      status: "pending",
      assignedStaff: "You",
    });
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Automated parent messages, template editor, inbox replies, and delivery settings."
      />

      <OverviewCards metrics={metrics} />

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1">
        {(
          [
            ["overview", "Overview"],
            ["template-library", "Template Library"],
            ["templates", "My Templates"],
            ["inbox", "Inbox"],
            ["campaigns", "Campaigns"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === id
                ? "border-b-2 border-teal-600 text-teal-700"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900">
            Only send messages that are relevant to the parent&apos;s booking or club
            updates. Marketing messages should only be sent where consent has been
            given.
          </div>

          <DashboardSection
            title="Delivery channels"
            description="Configure how parent messages are delivered across email, SMS, WhatsApp, and push."
          >
            <DeliveryChannelsSection canEdit={canManage} />
          </DashboardSection>

          <DashboardSection
            title="Reviews"
            description="Encourage verified parent reviews and configure automated request emails."
          >
            <ReviewRequestSettings canEdit={canManage} />
          </DashboardSection>
        </>
      ) : null}

      {activeTab === "template-library" ? (
        <DashboardSection
          title="Template Library"
          description="Browse and install ready-made communications packs for your club type."
        >
          <TemplateLibrarySection canEdit={canEditTemplates} />
        </DashboardSection>
      ) : null}

      {activeTab === "templates" ? (
        <DashboardSection
          title="Automated message templates"
          description="Templates A–M cover booking lifecycle, reminders, refunds, reviews, camps, and more. Platform defaults with optional club customisation."
        >
          <PlatformTemplatesSection canEdit={canEditTemplates} />
        </DashboardSection>
      ) : null}

      {activeTab === "inbox" ? (
        <DashboardSection
          title="Parent replies inbox"
          description="Messages from parents that need a response or follow-up."
        >
          {replies.length === 0 ? (
            <p className="text-sm text-zinc-500">No parent replies yet.</p>
          ) : (
            <ParentRepliesInbox
              replies={replies}
              canReply={canReply}
              onMarkResolved={handleMarkResolved}
              onAssignReply={handleAssignReply}
            />
          )}
        </DashboardSection>
      ) : null}

      {activeTab === "campaigns" ? (
        <DashboardSection
          title="Campaigns"
          description="Send updates and offers to the right parents without manual messaging."
          action={
            !canManage ? (
              <span className="text-xs font-medium text-zinc-400">
                Manager or owner required
              </span>
            ) : null
          }
        >
          <CampaignsSection canManage={canManage} />
        </DashboardSection>
      ) : null}
    </div>
  );
}
