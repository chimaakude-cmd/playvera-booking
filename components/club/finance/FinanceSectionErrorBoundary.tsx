"use client";

import { Component, type ReactNode } from "react";

type FinanceSectionErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
};

type FinanceSectionErrorBoundaryState = {
  hasError: boolean;
};

export class FinanceSectionErrorBoundary extends Component<
  FinanceSectionErrorBoundaryProps,
  FinanceSectionErrorBoundaryState
> {
  state: FinanceSectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): FinanceSectionErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-semibold text-[#0F172A]">
            {this.props.title ?? "This section could not load"}
          </p>
          <p className="mt-2 text-amber-900">
            Payment settings are still available elsewhere on this page. Refresh
            to try again, or contact Activora support if this keeps happening.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
