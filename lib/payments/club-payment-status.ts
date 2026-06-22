/**
 * Clear club payment status — only four states with explicit reasons.
 */

export type ClubPaymentStatusTone = "green" | "yellow" | "orange" | "red";

export type ClubPaymentStatusId =
  | "connected"
  | "awaiting_first_payment"
  | "setup_required"
  | "payout_pending"
  | "payments_paused";

export type PayoutSchedule = "daily" | "weekly" | "monthly";

export type ClubPaymentStatusSnapshot = {
  status: ClubPaymentStatusId;
  tone: ClubPaymentStatusTone;
  label: string;
  reason: string;
};

export type ResolveClubPaymentStatusInput = {
  paymentsEnabled: boolean;
  paymentsPaused: boolean;
  accountStatus: string;
  hasConfirmedPayment: boolean;
  hasPendingPayout: boolean;
  platformEnabled: boolean;
  /** True when GoCardless OAuth or Stripe Connect is connected. */
  hasPaymentProviderConnected: boolean;
};

export const CLUB_PAYMENT_STATUS_LABELS: Record<ClubPaymentStatusId, string> = {
  connected: "Connected",
  awaiting_first_payment: "Connected — awaiting bookings",
  setup_required: "Not connected",
  payout_pending: "Payout pending",
  payments_paused: "Payments paused",
};

export const PAYOUT_SCHEDULE_LABELS: Record<PayoutSchedule, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function resolveClubPaymentStatus(
  input: ResolveClubPaymentStatusInput,
): ClubPaymentStatusSnapshot {
  if (
    input.paymentsPaused ||
    !input.paymentsEnabled ||
    input.accountStatus === "suspended" ||
    input.accountStatus === "paused"
  ) {
    const reason = input.paymentsPaused
      ? "Activora has paused payments for this club. Contact support if you need help."
      : !input.paymentsEnabled
        ? "Payments are disabled for this club account."
        : "This club account is not active — payments are unavailable.";

    return {
      status: "payments_paused",
      tone: "red",
      label: CLUB_PAYMENT_STATUS_LABELS.payments_paused,
      reason,
    };
  }

  if (!input.platformEnabled) {
    return {
      status: "payments_paused",
      tone: "red",
      label: CLUB_PAYMENT_STATUS_LABELS.payments_paused,
      reason: "Activora payment platform is not yet available.",
    };
  }

  if (!input.hasPaymentProviderConnected) {
    return {
      status: "setup_required",
      tone: "yellow",
      label: CLUB_PAYMENT_STATUS_LABELS.setup_required,
      reason:
        "Connect your GoCardless account to receive payouts directly. Stripe card payments are optional.",
    };
  }

  if (input.hasPendingPayout) {
    return {
      status: "payout_pending",
      tone: "orange",
      label: CLUB_PAYMENT_STATUS_LABELS.payout_pending,
      reason:
        "A parent payment is being processed. Your payout will follow your schedule once cleared.",
    };
  }

  if (!input.hasConfirmedPayment) {
    return {
      status: "awaiting_first_payment",
      tone: "yellow",
      label: CLUB_PAYMENT_STATUS_LABELS.awaiting_first_payment,
      reason:
        "Connected to GoCardless. Payouts are sent directly to your bank account. Status will update after your first paid booking.",
    };
  }

  return {
    status: "connected",
    tone: "green",
    label: CLUB_PAYMENT_STATUS_LABELS.connected,
    reason:
      "Connected to GoCardless. Payouts are sent directly to your bank account.",
  };
}

export function estimateNextPayoutDate(
  schedule: PayoutSchedule,
  fromDate: Date = new Date(),
): Date {
  const next = new Date(fromDate);

  if (schedule === "daily") {
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
    return next;
  }

  if (schedule === "monthly") {
    next.setMonth(next.getMonth() + 1, 1);
    next.setHours(9, 0, 0, 0);
    return next;
  }

  // Weekly — next Monday 09:00 UTC
  const day = next.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  next.setDate(next.getDate() + daysUntilMonday);
  next.setHours(9, 0, 0, 0);
  return next;
}

export function formatPayoutDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function resolveEffectivePlatformFeePercent(
  override: number | null | undefined,
  defaultPercent: number,
): number {
  if (
    override !== null &&
    override !== undefined &&
    Number.isFinite(Number(override))
  ) {
    return Number(override);
  }

  return Number.isFinite(defaultPercent) ? defaultPercent : 0;
}

export type ClubPaymentStatusApiResponse = {
  provider: string;
  paymentModel: string;
  status: ClubPaymentStatusSnapshot;
  payoutSchedule: PayoutSchedule;
  payoutScheduleLabel: string;
  estimatedNextPayout: string;
  platformFeePercent: number;
  providerRecordMissing?: boolean;
  stripeOptional?: boolean;
  gocardlessAvailable?: boolean;
  gocardlessConnected?: boolean;
  stripeConnected?: boolean;
};

export function buildMissingProviderPaymentStatusResponse(
  platformFeePercent: number,
): ClubPaymentStatusApiResponse {
  const feePercent = resolveEffectivePlatformFeePercent(null, platformFeePercent);
  const payoutSchedule: PayoutSchedule = "weekly";
  const nextPayout = estimateNextPayoutDate(payoutSchedule);

  return {
    provider: "GoCardless",
    paymentModel: "club_oauth",
    providerRecordMissing: true,
    stripeOptional: true,
    gocardlessAvailable: false,
    gocardlessConnected: false,
    stripeConnected: false,
    status: {
      status: "setup_required",
      tone: "yellow",
      label: CLUB_PAYMENT_STATUS_LABELS.setup_required,
      reason:
        "Connect your GoCardless account to receive payouts directly. Stripe card payments are optional.",
    },
    payoutSchedule,
    payoutScheduleLabel: PAYOUT_SCHEDULE_LABELS[payoutSchedule],
    estimatedNextPayout: formatPayoutDate(nextPayout.toISOString()),
    platformFeePercent: feePercent,
  };
}
