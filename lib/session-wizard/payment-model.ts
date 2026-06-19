export type SessionPaymentModel = "block_individual" | "subscription";

export type SubscriptionBillingFrequency = "weekly" | "monthly" | "termly";

export type SubscriptionCollectionDate = "first_of_month" | "custom";

export type SubscriptionJoiningOption =
  | "immediate"
  | "prorated"
  | "free_trial";

export type SubscriptionCancellationPolicy = "instant" | "end_of_period";

export type SessionSubscriptionConfig = {
  amount: number;
  billingFrequency: SubscriptionBillingFrequency;
  collectionDate: SubscriptionCollectionDate;
  customCollectionDay: number | null;
  joiningOption: SubscriptionJoiningOption;
  cancellationPolicy: SubscriptionCancellationPolicy;
  pauseEnabled: boolean;
  retryFailedPayments: boolean;
};

export const SESSION_PAYMENT_MODEL_LABELS: Record<SessionPaymentModel, string> = {
  block_individual: "Block / Individual Booking",
  subscription: "Subscription",
};

export const SUBSCRIPTION_BILLING_FREQUENCY_LABELS: Record<
  SubscriptionBillingFrequency,
  string
> = {
  weekly: "Weekly",
  monthly: "Monthly",
  termly: "Termly",
};

export const SUBSCRIPTION_JOINING_OPTION_LABELS: Record<
  SubscriptionJoiningOption,
  string
> = {
  immediate: "Charge immediately",
  prorated: "Prorated first month",
  free_trial: "Free trial",
};

export const SUBSCRIPTION_CANCELLATION_LABELS: Record<
  SubscriptionCancellationPolicy,
  string
> = {
  instant: "Instant",
  end_of_period: "End of billing period",
};

export function createDefaultSubscriptionConfig(): SessionSubscriptionConfig {
  return {
    amount: 0,
    billingFrequency: "monthly",
    collectionDate: "first_of_month",
    customCollectionDay: null,
    joiningOption: "immediate",
    cancellationPolicy: "end_of_period",
    pauseEnabled: true,
    retryFailedPayments: true,
  };
}

export function paymentModelToBookingStructure(
  paymentModel: SessionPaymentModel,
  current: "individual" | "block" | "subscription" | null,
): "individual" | "block" | "subscription" {
  if (paymentModel === "subscription") {
    return "subscription";
  }

  if (current === "individual" || current === "block") {
    return current;
  }

  return "individual";
}

export function validateSessionSubscriptionConfig(
  config: SessionSubscriptionConfig,
): string[] {
  const errors: string[] = [];

  if (config.amount <= 0) {
    errors.push("Subscription amount must be greater than 0");
  }

  if (
    config.collectionDate === "custom" &&
    (config.customCollectionDay === null ||
      config.customCollectionDay < 1 ||
      config.customCollectionDay > 28)
  ) {
    errors.push("Choose a collection day between 1 and 28");
  }

  return errors;
}

export function formatSubscriptionConfigSummary(
  config: SessionSubscriptionConfig,
): string {
  const frequency =
    SUBSCRIPTION_BILLING_FREQUENCY_LABELS[config.billingFrequency].toLowerCase();
  const amount = `£${config.amount.toFixed(2)}`;
  const collection =
    config.collectionDate === "first_of_month"
      ? "collected on the 1st"
      : `collected on day ${config.customCollectionDay}`;

  return `${amount} ${frequency}, ${collection}`;
}

/** @deprecated Use block_individual — kept for draft migration. */
export function normalizeSessionPaymentModel(
  value: string | null | undefined,
): SessionPaymentModel | null {
  if (!value) {
    return null;
  }

  if (value === "subscription") {
    return "subscription";
  }

  if (value === "block_individual" || value === "sessions") {
    return "block_individual";
  }

  return null;
}
