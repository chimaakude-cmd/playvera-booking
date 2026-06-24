"use client";

import { Component, type ReactNode } from "react";
import {
  PAYMENT_PROVIDER_DEFINITIONS,
  type PaymentProviderId,
} from "@/lib/payment-providers/config";

type ProviderFinanceCardErrorBoundaryProps = {
  providerId: PaymentProviderId;
  stripeReady?: boolean;
  onError?: (providerId: PaymentProviderId) => void;
  children: ReactNode;
};

type ProviderFinanceCardErrorBoundaryState = {
  hasError: boolean;
};

function resolveProviderCardErrorMessage(
  providerId: PaymentProviderId,
  stripeReady: boolean,
): string {
  if (providerId === "gocardless") {
    if (stripeReady) {
      return "GoCardless status could not be loaded. Stripe is still active, so paid activities can continue. Try refreshing GoCardless status.";
    }

    return "GoCardless is temporarily unavailable. Try refreshing GoCardless status.";
  }

  return "Stripe status could not be loaded. Try refreshing the page.";
}

export class ProviderFinanceCardErrorBoundary extends Component<
  ProviderFinanceCardErrorBoundaryProps,
  ProviderFinanceCardErrorBoundaryState
> {
  state: ProviderFinanceCardErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ProviderFinanceCardErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.props.onError?.(this.props.providerId);
  }

  render() {
    if (this.state.hasError) {
      const provider = PAYMENT_PROVIDER_DEFINITIONS[this.props.providerId];
      const stripeReady = this.props.stripeReady === true;

      return (
        <div className="rounded-xl border border-orange-100/80 bg-[#FFFBF7] p-5">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: provider.brandColor }}
            >
              {provider.brandInitial}
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A]">{provider.name}</h3>
              <span className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                Temporarily unavailable
              </span>
              <p className="mt-3 text-sm text-zinc-600">
                {resolveProviderCardErrorMessage(
                  this.props.providerId,
                  stripeReady,
                )}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
