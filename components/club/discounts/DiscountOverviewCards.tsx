import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import type { DiscountMetrics } from "@/lib/club-discounts";
import { formatMoney } from "@/lib/payments";

type DiscountOverviewCardsProps = {
  metrics: DiscountMetrics;
};

export function DiscountOverviewCards({ metrics }: DiscountOverviewCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        label="Active discounts"
        value={String(metrics.activeDiscounts)}
        hint="Currently redeemable codes"
        accent="teal"
      />
      <DashboardStatCard
        label="Total redemptions"
        value={String(metrics.totalRedemptions)}
        hint="Codes used on bookings"
        accent="violet"
      />
      <DashboardStatCard
        label="Revenue discounted"
        value={formatMoney(metrics.revenueDiscounted)}
        hint="Total savings given to parents"
        accent="amber"
      />
      <DashboardStatCard
        label="Expiring soon"
        value={String(metrics.expiringSoon)}
        hint="Ending within 14 days"
        accent="rose"
      />
    </div>
  );
}
