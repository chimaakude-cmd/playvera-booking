import {
  appendGoCardlessPlatformLog,
  recordGoCardlessPaymentSplit,
} from "./platform-config";

export type GoCardlessWebhookEventInput = {
  resourceType: "payments" | "mandates" | "subscriptions";
  action: string;
  links: Record<string, string | undefined>;
  simulated?: boolean;
};

const SUPPORTED_PAYMENT_ACTIONS = new Set([
  "created",
  "confirmed",
  "paid_out",
  "failed",
]);

const SUPPORTED_MANDATE_ACTIONS = new Set(["created", "cancelled", "active"]);

export async function handleGoCardlessBookingWebhookEvent(
  event: GoCardlessWebhookEventInput,
): Promise<{ handled: boolean; message: string }> {
  const { resourceType, action } = event;
  const paymentId = event.links.payment ?? event.links.payments;
  const mandateId = event.links.mandate ?? event.links.mandates;

  if (resourceType === "payments" && SUPPORTED_PAYMENT_ACTIONS.has(action)) {
    const status =
      action === "confirmed"
        ? "confirmed"
        : action === "paid_out"
          ? "confirmed"
          : action === "failed"
            ? "failed"
            : "payment_pending";

    await appendGoCardlessPlatformLog({
      level: action === "failed" ? "error" : "info",
      eventType: `payment_${action}`,
      message: `GoCardless payment ${action}${paymentId ? `: ${paymentId}` : ""}.`,
      metadata: { paymentId, action, simulated: event.simulated ?? false },
    });

    if (action === "created" && event.simulated) {
      await recordGoCardlessPaymentSplit({
        bookingId: randomTestBookingId(),
        providerId: randomTestProviderId(),
        grossAmount: 50,
        processingFee: 0.7,
        platformFee: 1.25,
        netAmount: 48.05,
        status: "payment_pending",
        paymentId: paymentId ?? null,
        mandateId: mandateId ?? null,
      });
    }

    return {
      handled: true,
      message: `Payment webhook ${action} processed.`,
    };
  }

  if (resourceType === "mandates" && SUPPORTED_MANDATE_ACTIONS.has(action)) {
    await appendGoCardlessPlatformLog({
      level: action === "cancelled" ? "warn" : "info",
      eventType: `mandate_${action}`,
      message: `GoCardless mandate ${action}${mandateId ? `: ${mandateId}` : ""}.`,
      metadata: { mandateId, action, simulated: event.simulated ?? false },
    });

    return {
      handled: true,
      message: `Mandate webhook ${action} processed.`,
    };
  }

  return {
    handled: false,
    message: `Unhandled GoCardless event ${resourceType}.${action}.`,
  };
}

function randomTestBookingId(): string {
  return `sim-booking-${Date.now()}`;
}

function randomTestProviderId(): string {
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
}
