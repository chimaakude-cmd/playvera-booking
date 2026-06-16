export type GoCardlessConnectionStatus =
  | "not_connected"
  | "pending_setup"
  | "connected"
  | "action_required"
  | "disconnected";

export type GoCardlessPaymentStatus =
  | "pending_mandate"
  | "payment_pending"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "refunded";

export type GoCardlessConnection = {
  provider_id: string;
  organisation_id: string | null;
  access_token: string | null;
  merchant_id: string | null;
  status: GoCardlessConnectionStatus;
  created_at: string;
  updated_at: string;
};

export type GoCardlessPayment = {
  booking_id: string;
  provider_id: string;
  amount: number;
  activora_fee: number;
  gocardless_fee: number;
  provider_net: number;
  status: GoCardlessPaymentStatus;
  mandate_id: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export const GOCARDLESS_CONNECTIONS_STORAGE_KEY =
  "activora-gocardless-connections";

export const GOCARDLESS_PAYMENTS_STORAGE_KEY = "activora-gocardless-payments";

export const GOCARDLESS_STATUS_LABELS: Record<GoCardlessConnectionStatus, string> =
  {
    not_connected: "Not connected",
    pending_setup: "Setup in progress",
    connected: "Connected",
    action_required: "Action required",
    disconnected: "Disconnected",
  };

export const GOCARDLESS_PAYMENT_STATUS_LABELS: Record<
  GoCardlessPaymentStatus,
  string
> = {
  pending_mandate: "Pending mandate",
  payment_pending: "Payment pending",
  confirmed: "Confirmed",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function isGoCardlessConnected(status: GoCardlessConnectionStatus): boolean {
  return status === "connected";
}
