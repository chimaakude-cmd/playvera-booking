"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import {
  getActivitiesForProvider,
  getBookingsForProvider,
  getProviderById,
  PROVIDER_ACCOUNT_STATUS_LABELS,
  PROVIDER_STRIPE_STATUS_LABELS,
} from "@/lib/admin";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  providerId: string;
};

export function AdminProviderDetailSection({ providerId }: Props) {
  const provider = getProviderById(providerId);
  const [saved, setSaved] = useState(false);

  if (!provider) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-sm text-zinc-500">Provider not found.</p>
        <Link
          href="/admin/providers"
          className="mt-4 inline-block text-sm font-medium text-violet-700"
        >
          Back to providers
        </Link>
      </div>
    );
  }

  const bookings = getBookingsForProvider(providerId);
  const activities = getActivitiesForProvider(providerId);

  function handleStubAction(label: string) {
    setSaved(false);
    window.alert(`${label} — stub action for ${provider!.clubName}`);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={provider.clubName}
        description={`Provider ID: ${provider.id} · Joined ${provider.joinedAt}`}
        action={
          <Link
            href="/admin/providers"
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Back to list
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {provider.verified ? (
          <button
            type="button"
            onClick={() => handleStubAction("Unverify")}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Unverify
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleStubAction("Verify")}
            className="rounded-xl bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800"
          >
            Verify provider
          </button>
        )}
        {provider.accountStatus === "active" ? (
          <button
            type="button"
            onClick={() => handleStubAction("Suspend")}
            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
          >
            Suspend
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleStubAction("Reactivate")}
            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Reactivate
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Provider details</h2>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Club name</span>
            <input
              defaultValue={provider.clubName}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Owner name</span>
            <input
              defaultValue={provider.ownerName}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Email</span>
            <input
              defaultValue={provider.email}
              type="email"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Phone</span>
            <input
              defaultValue={provider.phone}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Save details
          </button>
          {saved ? (
            <p className="text-xs text-emerald-600">Details saved (stub).</p>
          ) : null}
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Public profile</h2>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Slug</span>
            <input
              defaultValue={provider.slug}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Location</span>
            <input
              defaultValue={provider.location}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Website</span>
            <input
              defaultValue={provider.website}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Description</span>
            <textarea
              defaultValue={provider.description}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Save profile
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Stripe status</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Connect status</dt>
              <dd className="font-medium text-zinc-900">
                {PROVIDER_STRIPE_STATUS_LABELS[provider.stripeStatus]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Account ID</dt>
              <dd className="font-mono text-xs text-zinc-700">
                {provider.stripeAccountId || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Account status</dt>
              <dd className="font-medium text-zinc-900">
                {PROVIDER_ACCOUNT_STATUS_LABELS[provider.accountStatus]}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => handleStubAction("Open Stripe dashboard")}
            className="mt-4 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            View in Stripe (stub)
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900">Finance summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Total revenue</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatCurrency(provider.totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Platform fees paid</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatCurrency(provider.platformFeesPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Pending payout</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatCurrency(provider.pendingPayout)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            {provider.totalBookings} total bookings · Plan: {provider.subscriptionPlan}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Bookings ({bookings.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100 text-sm">
            <thead>
              <tr className="bg-zinc-50/80 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2 text-left">Reference</th>
                <th className="px-4 py-2 text-left">Parent / Child</th>
                <th className="px-4 py-2 text-left">Activity</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    No bookings for this provider.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 font-mono text-xs">{booking.reference}</td>
                    <td className="px-4 py-3">
                      {booking.parentName}
                      <span className="block text-xs text-zinc-500">
                        {booking.childName}
                      </span>
                    </td>
                    <td className="px-4 py-3">{booking.activityTitle}</td>
                    <td className="px-4 py-3 capitalize">{booking.status.replace("_", " ")}</td>
                    <td className="px-4 py-3">{formatCurrency(booking.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-600">
            {activities.length} activit{activities.length === 1 ? "y" : "ies"} listed.{" "}
            <Link href="/admin/activities" className="font-medium text-violet-700">
              View all activities
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
