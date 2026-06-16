import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import type { ActivityMetrics } from "@/lib/club-activities";
import { formatMoney } from "@/lib/payments";

type ActivitiesMetricsProps = {
  metrics: ActivityMetrics;
};

export function ActivitiesMetrics({ metrics }: ActivitiesMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <DashboardStatCard
        label="Active activities"
        value={String(metrics.activeActivities)}
        hint="Published and bookable"
        accent="teal"
      />
      <DashboardStatCard
        label="Upcoming sessions"
        value={String(metrics.upcomingSessions)}
        hint="Scheduled from today"
        accent="violet"
      />
      <DashboardStatCard
        label="Places booked"
        value={String(metrics.placesBooked)}
        hint="Confirmed across activities"
        accent="amber"
      />
      <DashboardStatCard
        label="Occupancy"
        value={`${metrics.occupancyPercent}%`}
        hint="Capacity filled overall"
        accent="slate"
      />
      <DashboardStatCard
        label="Revenue this month"
        value={formatMoney(metrics.revenueThisMonth)}
        hint="From confirmed bookings"
        accent="rose"
      />
    </div>
  );
}
