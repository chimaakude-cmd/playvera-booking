"use client";

import { showStripeDiagnostics } from "@/lib/stripe-connect";
import { FinanceButton } from "./shared";

export type StripeConnectDebugInfo = {
  stripe_enabled: boolean;
  connect_enabled: boolean;
  account_exists: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_required: boolean;
  environment: "test" | "live" | null;
};

type StripeConnectUnavailableNoticeProps = {
  message?: string;
  adminDetail?: string | null;
  debug?: StripeConnectDebugInfo | null;
  onTryAgain?: () => void;
  tryAgainLoading?: boolean;
};

export function StripeConnectUnavailableNotice({
  message = "Connect Stripe to accept paid bookings. You can still create free activities while you finish payment setup.",
  adminDetail = null,
  debug = null,
  onTryAgain,
  tryAgainLoading = false,
}: StripeConnectUnavailableNoticeProps) {
  const showAdminDetail =
    Boolean(adminDetail) && showStripeDiagnostics();
  const showDebug = Boolean(debug) && showStripeDiagnostics();

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
      <p className="font-semibold">Connect Stripe to accept paid bookings.</p>
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
            Refresh status
          </FinanceButton>
        ) : null}
      </div>

      {showDebug && debug ? (
        <details className="mt-4 rounded-md border border-sky-300/60 bg-sky-100/40 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-sky-900">
            Stripe diagnostics
          </summary>
          <dl className="mt-2 grid gap-1 text-xs text-sky-900 sm:grid-cols-2">
            <DebugRow label="stripe_enabled" value={String(debug.stripe_enabled)} />
            <DebugRow label="connect_enabled" value={String(debug.connect_enabled)} />
            <DebugRow label="account_exists" value={String(debug.account_exists)} />
            <DebugRow label="charges_enabled" value={String(debug.charges_enabled)} />
            <DebugRow label="payouts_enabled" value={String(debug.payouts_enabled)} />
            <DebugRow
              label="onboarding_required"
              value={String(debug.onboarding_required)}
            />
            <DebugRow label="environment" value={debug.environment ?? "unknown"} />
          </dl>
        </details>
      ) : null}

      {showAdminDetail ? (
        <details className="mt-4 rounded-md border border-sky-300/60 bg-sky-100/40 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-sky-900">
            Admin / developer details
          </summary>
          <p className="mt-2 text-xs text-sky-900">{adminDetail}</p>
        </details>
      ) : null}
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 font-mono">
      <dt className="text-sky-700">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
