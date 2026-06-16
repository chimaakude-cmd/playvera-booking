"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { paginateItems } from "@/lib/pagination";
import {
  MOCK_PROVIDERS,
  PROVIDER_ACCOUNT_STATUS_LABELS,
  PROVIDER_STRIPE_STATUS_LABELS,
  type AdminProvider,
} from "@/lib/admin";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function StripeStatusBadge({ status }: { status: AdminProvider["stripeStatus"] }) {
  const styles: Record<AdminProvider["stripeStatus"], string> = {
    not_connected: "bg-zinc-100 text-zinc-600",
    action_required: "bg-amber-50 text-amber-800",
    connected: "bg-sky-50 text-sky-700",
    restricted: "bg-rose-50 text-rose-700",
    payouts_enabled: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {PROVIDER_STRIPE_STATUS_LABELS[status]}
    </span>
  );
}

function AccountStatusBadge({
  status,
}: {
  status: AdminProvider["accountStatus"];
}) {
  const styles: Record<AdminProvider["accountStatus"], string> = {
    active: "bg-emerald-50 text-emerald-700",
    paused: "bg-amber-50 text-amber-800",
    suspended: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {PROVIDER_ACCOUNT_STATUS_LABELS[status]}
    </span>
  );
}

export function AdminProvidersSection() {
  const [page, setPage] = useState(1);
  const pagination = useMemo(
    () => paginateItems(MOCK_PROVIDERS, page, 10),
    [page],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Providers"
        description="Manage clubs on the Activora marketplace — view, verify, and monitor Stripe Connect."
        action={
          <button
            type="button"
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Export list
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "Club",
                  "Owner",
                  "Stripe",
                  "Plan",
                  "Revenue",
                  "Status",
                  "Verified",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pagination.items.map((provider) => (
                <tr
                  key={provider.id}
                  className="transition-colors hover:bg-zinc-50/50"
                >
                  <td className="whitespace-nowrap px-4 py-4">
                    <Link
                      href={`/admin/providers/${provider.id}`}
                      className="text-sm font-medium text-violet-700 hover:text-violet-900"
                    >
                      {provider.clubName}
                    </Link>
                    <p className="text-xs text-zinc-500">{provider.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                    {provider.ownerName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <StripeStatusBadge status={provider.stripeStatus} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                    {provider.subscriptionPlan}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-zinc-900">
                    {formatCurrency(provider.totalRevenue)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <AccountStatusBadge status={provider.accountStatus} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                    {provider.verified ? "Yes" : "No"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/providers/${provider.id}`}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                      >
                        View
                      </Link>
                      {["Suspend", "Verify"].map((action) => (
                        <button
                          key={action}
                          type="button"
                          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
