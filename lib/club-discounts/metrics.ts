import type {
  ClubDiscount,
  DiscountMetrics,
  DiscountRedemption,
} from "./types";
import { resolveDiscountStatus } from "./types";

const EXPIRING_SOON_DAYS = 14;

export function calculateDiscountAmount(
  bookingPrice: number,
  discount: Pick<
    ClubDiscount,
    "type" | "value" | "minimumSpend" | "isActive" | "isPaused" | "isArchived"
  >,
): number {
  if (discount.isArchived || discount.isPaused || !discount.isActive) {
    return 0;
  }

  if (bookingPrice < discount.minimumSpend) {
    return 0;
  }

  const raw =
    discount.type === "percentage"
      ? (bookingPrice * discount.value) / 100
      : discount.value;

  return Math.min(Math.max(raw, 0), bookingPrice);
}

export function getDiscountMetrics(
  discounts: ClubDiscount[],
  redemptions: DiscountRedemption[] = [],
): DiscountMetrics {
  const now = new Date();
  const soonThreshold = new Date(now);
  soonThreshold.setDate(soonThreshold.getDate() + EXPIRING_SOON_DAYS);

  const activeDiscounts = discounts.filter(
    (discount) => resolveDiscountStatus(discount, now) === "active",
  ).length;

  const totalRedemptions = redemptions.length;

  const revenueDiscounted = redemptions.reduce(
    (sum, redemption) => sum + redemption.discountAmount,
    0,
  );

  const expiringSoon = discounts.filter((discount) => {
    if (discount.isArchived || discount.isPaused || !discount.endDate) {
      return false;
    }

    const status = resolveDiscountStatus(discount, now);
    if (status !== "active" && status !== "scheduled") {
      return false;
    }

    const end = new Date(`${discount.endDate}T23:59:59`);
    return end >= now && end <= soonThreshold;
  }).length;

  return {
    activeDiscounts,
    totalRedemptions,
    revenueDiscounted,
    expiringSoon,
  };
}
