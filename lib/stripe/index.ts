import type { StripeConnectDashboard, StripeConnectState, StripeConnectStatus } from "@/lib/stripe-connect/types";
import { DEMO_PROVIDER_ID } from "@/lib/stripe-connect/types";

export type { StripeConnectDashboard, StripeConnectState, StripeConnectStatus };

export {
  STRIPE_CONNECT_STATUS_LABELS,
  canUseBookkeepingIntegrations,
  isStripeConnected,
} from "@/lib/stripe-connect/types";

export {
  resolveStripeConnectStatus,
  mapStripeAccountToState,
  buildStripeConnectState,
  createExpressConnectAccount,
  createOnboardingLink,
  formatPayoutSchedule,
  resolveVerificationStatus,
} from "./connect";
