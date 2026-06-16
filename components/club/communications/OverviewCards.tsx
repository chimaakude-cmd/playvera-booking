import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import type { CommunicationsMetrics } from "@/lib/club-communications";

type OverviewCardsProps = {
  metrics: CommunicationsMetrics;
};

export function OverviewCards({ metrics }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardStatCard
        label="Messages sent"
        value={String(metrics.messagesSentThisMonth)}
        hint="Sent this month"
        accent="teal"
      />
      <DashboardStatCard
        label="Scheduled"
        value={String(metrics.scheduledMessages)}
        hint="Queued for delivery"
        accent="violet"
      />
      <DashboardStatCard
        label="Birthdays due"
        value={String(metrics.birthdayMessagesDue)}
        hint="Birthdays during active blocks"
        accent="amber"
      />
      <DashboardStatCard
        label="Review requests"
        value={String(metrics.reviewRequestsSent)}
        hint="Sent this month"
        accent="slate"
      />
      <DashboardStatCard
        label="Failed messages"
        value={String(metrics.failedMessages)}
        hint="Delivery failures"
        accent="rose"
      />
      <DashboardStatCard
        label="Replies to review"
        value={String(metrics.parentRepliesNeedingAttention)}
        hint="Open parent replies"
        accent="teal"
      />
    </div>
  );
}
