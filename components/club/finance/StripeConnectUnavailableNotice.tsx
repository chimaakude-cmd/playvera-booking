"use client";

import { FinanceButton } from "./shared";

type StripeConnectUnavailableNoticeProps = {
  message?: string;
  adminDetail?: string | null;
  onTryAgain?: () => void;
  tryAgainLoading?: boolean;
};

export function StripeConnectUnavailableNotice({
  message = "Payments setup is temporarily unavailable. You can still create free activities while we finish payment setup.",
  adminDetail = null,
  onTryAgain,
  tryAgainLoading = false,
}: StripeConnectUnavailableNoticeProps) {
  const showAdminDetail =
    Boolean(adminDetail) && process.env.NODE_ENV !== "production";

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p className="font-semibold">Payments setup unavailable</p>
      <p className="mt-2">{message}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FinanceButton
          onClick={() => {
            window.location.href = "/club/create-session";
          }}
        >
          Create free activity
        </FinanceButton>
        {onTryAgain ? (
          <FinanceButton
            variant="secondary"
            onClick={onTryAgain}
            disabled={tryAgainLoading}
          >
            Try again later
          </FinanceButton>
        ) : (
          <FinanceButton
            variant="secondary"
            onClick={() => {
              window.location.href = "/club/dashboard";
            }}
          >
            Try again later
          </FinanceButton>
        )}
      </div>

      {showAdminDetail ? (
        <details className="mt-4 rounded-md border border-amber-300/60 bg-amber-100/40 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-amber-900">
            Admin / developer details
          </summary>
          <p className="mt-2 text-xs text-amber-900">{adminDetail}</p>
        </details>
      ) : null}
    </div>
  );
}
