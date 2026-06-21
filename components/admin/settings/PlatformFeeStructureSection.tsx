"use client";

import Link from "next/link";

export function PlatformFeeStructureSection() {
  return (
    <div className="max-w-3xl space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Platform booking fees</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Booking fees, monthly prices, and plan limits are managed in Subscription
          Plans. All plans currently share one universal booking fee (2.5%); payment
          processor fees are separate.
        </p>
      </div>
      <Link
        href="/admin/plans"
        className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Manage subscription plans
      </Link>
    </div>
  );
}
