export const STRIPE_CONNECT_LOG_PREFIX = "[stripe-connect]";

export const STRIPE_CONNECT_CLUB_MESSAGES = {
  platformUnavailable:
    "Payments setup is temporarily unavailable. You can still create free activities while we finish payment setup.",
  genericFailure:
    "We couldn't start payment setup right now. Please try again in a few minutes.",
  notConfigured:
    "Payments setup is temporarily unavailable. You can still create free activities while we finish payment setup.",
} as const;

export type StripeConnectErrorCode =
  | "platform_unavailable"
  | "transient"
  | "not_configured";

const CONNECT_SIGNUP_ERROR = "signed up for Connect";

export function getRawStripeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "Stripe Connect failed.";
}

export function isStripeConnectPlatformMisconfigured(error: unknown): boolean {
  return getRawStripeErrorMessage(error).includes(CONNECT_SIGNUP_ERROR);
}

export function getStripeConnectTechnicalMessage(error: unknown): string {
  const message = getRawStripeErrorMessage(error);

  if (isStripeConnectPlatformMisconfigured(error)) {
    return (
      "Stripe Connect is not enabled on this platform account. Enable Express (UK) in Stripe Dashboard → Settings → Connect → Platform / Marketplace."
    );
  }

  return message;
}

export function classifyStripeConnectError(
  error: unknown,
): StripeConnectErrorCode {
  if (isStripeConnectPlatformMisconfigured(error)) {
    return "platform_unavailable";
  }

  const message = getRawStripeErrorMessage(error);

  if (
    message.includes("STRIPE_SECRET_KEY") ||
    message.toLowerCase().includes("not configured")
  ) {
    return "not_configured";
  }

  return "transient";
}

export function getStripeConnectClubMessage(error: unknown): string {
  const code = classifyStripeConnectError(error);

  switch (code) {
    case "platform_unavailable":
    case "not_configured":
      return STRIPE_CONNECT_CLUB_MESSAGES.platformUnavailable;
    default:
      return STRIPE_CONNECT_CLUB_MESSAGES.genericFailure;
  }
}

export function getStripeApiErrorFields(error: unknown): {
  message?: string;
  type?: string;
  code?: string;
} {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  const stripeError = error as Record<string, unknown>;
  return {
    message:
      typeof stripeError.message === "string" ? stripeError.message : undefined,
    type: typeof stripeError.type === "string" ? stripeError.type : undefined,
    code: typeof stripeError.code === "string" ? stripeError.code : undefined,
  };
}

export function logStripeConnectError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const technical = getStripeConnectTechnicalMessage(error);
  const code = classifyStripeConnectError(error);
  const stripeApi = getStripeApiErrorFields(error);

  console.error(STRIPE_CONNECT_LOG_PREFIX, {
    code,
    message: technical,
    stripeType: stripeApi.type,
    stripeCode: stripeApi.code,
    stripeMessage: stripeApi.message,
    ...context,
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
  });
}

export function isStripeConnectAdminDebugEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export type StripeConnectErrorResponse = {
  error: string;
  code: StripeConnectErrorCode;
  adminDetail?: string;
};

export function buildStripeConnectErrorResponse(
  error: unknown,
  context?: Record<string, unknown>,
): StripeConnectErrorResponse {
  logStripeConnectError(error, context);

  const code = classifyStripeConnectError(error);
  const response: StripeConnectErrorResponse = {
    error: getStripeConnectClubMessage(error),
    code,
  };

  if (isStripeConnectAdminDebugEnabled()) {
    response.adminDetail = getStripeConnectTechnicalMessage(error);
  }

  return response;
}

/** @deprecated Prefer getStripeConnectClubMessage or getStripeConnectTechnicalMessage */
export function getStripeConnectErrorMessage(error: unknown): string {
  return getStripeConnectTechnicalMessage(error);
}
