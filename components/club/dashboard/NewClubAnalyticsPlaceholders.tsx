"use client";

import { DashboardSection } from "./DashboardCards";

type PlaceholderCardProps = {
  title: string;
  message: string;
};

function PlaceholderCard({ title, message }: PlaceholderCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <p className="mt-3 text-sm text-zinc-600">{message}</p>
    </div>
  );
}

export function NewClubAnalyticsPlaceholders() {
  return (
    <div className="space-y-6">
      <DashboardSection
        title="Revenue"
        description="Financial insights for your club"
      >
        <PlaceholderCard
          title="Revenue"
          message="Revenue insights appear after your first booking."
        />
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Bookings" description="Booking activity over time">
          <PlaceholderCard
            title="Bookings"
            message="Bookings will appear once parents book."
          />
        </DashboardSection>

        <DashboardSection title="Reviews" description="Parent feedback">
          <PlaceholderCard
            title="Reviews"
            message="Reviews unlock after your first completed session."
          />
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Activity performance"
          description="How your sessions are performing"
        >
          <PlaceholderCard
            title="Performance"
            message="Publish your first activity to see performance insights."
          />
        </DashboardSection>

        <DashboardSection title="Capacity & attendance" description="Session fill rates">
          <PlaceholderCard
            title="Capacity"
            message="Capacity and attendance data appear once sessions are bookable."
          />
        </DashboardSection>
      </div>

      <DashboardSection title="Growth" description="Club growth trends">
        <PlaceholderCard
          title="Growth"
          message="Growth metrics unlock after your first bookings."
        />
      </DashboardSection>
    </div>
  );
}
