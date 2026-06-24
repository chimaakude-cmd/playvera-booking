import type { ClubSession, SessionTicket } from "@/lib/sessions";
import type { SessionSubscriptionConfig } from "@/lib/session-wizard/payment-model";

export type TicketSubscriptionBilling = {
  billingStartDate?: string;
  billingDay?: number | null;
  trialDays?: number | null;
  cancelAnytime?: boolean;
  minimumCommitmentMonths?: number | null;
};

export type ResolvedSessionSubscription = {
  enabled: boolean;
  monthlyPrice: number;
  billingInterval: "month" | "week";
  billingStartDate: string | null;
  billingDay: number | null;
  trialDays: number | null;
  cancelAnytime: boolean;
  minimumCommitmentMonths: number | null;
  ticketId: string | null;
};

export type ParentSubscriptionStatus =
  | "pending"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export type ParentSubscriptionRecord = {
  id: string;
  sessionId: string;
  ticketId: string | null;
  bookingId: string | null;
  providerId: string;
  parentEmail: string;
  parentName: string;
  childName: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string | null;
  status: ParentSubscriptionStatus;
  monthlyAmount: number;
  platformFeePercent: number;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  lastPaymentFailedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionSubscriptionStats = {
  activeSubscribers: number;
  trialingSubscribers: number;
  failedPayments: number;
  estimatedMrr: number;
  records: ParentSubscriptionRecord[];
};

function ticketBilling(ticket: SessionTicket): TicketSubscriptionBilling {
  return ticket.subscriptionBilling ?? {};
}

function configFromSchedule(
  session: ClubSession,
): SessionSubscriptionConfig | null {
  return session.schedule?.subscriptionConfig ?? null;
}

export function sessionHasSubscriptionBilling(session: ClubSession): boolean {
  if (session.bookingStructure === "subscription") {
    return true;
  }

  if (session.subscriptionEnabled) {
    return true;
  }

  return (session.tickets ?? []).some(
    (ticket) => ticket.priceType === "subscription",
  );
}

export function resolveSessionSubscription(
  session: ClubSession,
  ticketId?: string | null,
): ResolvedSessionSubscription | null {
  if (!sessionHasSubscriptionBilling(session)) {
    return null;
  }

  const subscriptionTicket =
    (ticketId
      ? session.tickets?.find((ticket) => ticket.id === ticketId)
      : undefined) ??
    session.tickets?.find((ticket) => ticket.priceType === "subscription") ??
    session.tickets?.[0];

  const scheduleConfig = configFromSchedule(session);
  const ticketConfig = subscriptionTicket
    ? ticketBilling(subscriptionTicket)
    : {};

  const monthlyPrice =
    subscriptionTicket?.priceType === "subscription"
      ? subscriptionTicket.price
      : scheduleConfig?.amount ?? session.price;

  if (!monthlyPrice || monthlyPrice <= 0) {
    return null;
  }

  const billingFrequency = scheduleConfig?.billingFrequency ?? "monthly";
  const billingInterval: "month" | "week" =
    billingFrequency === "weekly" ? "week" : "month";

  const billingDay =
    ticketConfig.billingDay ??
    (scheduleConfig?.collectionDate === "custom"
      ? scheduleConfig.customCollectionDay
      : 1);

  return {
    enabled: true,
    monthlyPrice,
    billingInterval,
    billingStartDate: ticketConfig.billingStartDate ?? null,
    billingDay: billingDay ?? null,
    trialDays:
      ticketConfig.trialDays ??
      (scheduleConfig?.joiningOption === "free_trial" ? 14 : null),
    cancelAnytime:
      ticketConfig.cancelAnytime ??
      scheduleConfig?.cancellationPolicy !== "instant",
    minimumCommitmentMonths: ticketConfig.minimumCommitmentMonths ?? null,
    ticketId: subscriptionTicket?.id ?? null,
  };
}

export function formatBillingStartLabel(
  subscription: ResolvedSessionSubscription,
): string {
  if (subscription.billingStartDate) {
    return new Date(`${subscription.billingStartDate}T12:00:00`).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" },
    );
  }

  return "Next billing cycle";
}
