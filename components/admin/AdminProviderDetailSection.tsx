"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChangePlanModal,
  EditAccountModal,
  PaymentSettingsModal,
  patchProvider,
} from "@/components/admin/AdminProviderActions";
import { PageHeader } from "@/components/club/PageHeader";
import {
  formatGocardlessStatusLabel,
  formatProviderRevenue,
  formatStripeStatusLabel,
  PAYMENT_PROVIDER_MODE_LABELS,
  PROVIDER_ACCOUNT_STATUS_LABELS,
  PROVIDER_ORGANISATION_TYPE_LABELS,
} from "@/lib/admin";
import { AdminProviderPaymentControls } from "@/components/admin/AdminProviderPaymentControls";
import type { AdminProviderDetail } from "@/lib/admin/types";
import {
  ADMIN_VAT_FLAG_LABELS,
  type AdminVatFlag,
} from "@/lib/club-finance/vat-threshold";
import { formatMoney } from "@/lib/payments";

type Props = {
  provider: AdminProviderDetail | null;
};

export function AdminProviderDetailSection({ provider }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"edit" | "plan" | "payment" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const activeProvider = provider;

  function refresh() {
    router.refresh();
  }

  async function handleDetailsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await patchProvider(activeProvider.id, {
      clubName: String(form.get("clubName") ?? ""),
      ownerName: String(form.get("ownerName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    refresh();
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await patchProvider(activeProvider.id, {
      slug: String(form.get("slug") ?? ""),
      location: String(form.get("location") ?? ""),
      website: String(form.get("website") ?? ""),
      description: String(form.get("description") ?? ""),
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    refresh();
  }

  async function toggleVerified() {
    setError(null);
    const result = await patchProvider(activeProvider.id, {
      verified: !activeProvider.verified,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    refresh();
  }

  async function handleDeleteProvider() {
    setDeleteError(null);

    const confirmed = window.confirm(
      "Permanently delete this provider? Login, profile, public listing, activities, registers, drafts, settings, team, media, and marketplace access will be disabled. Completed payment, payout, finance, and audit records will be retained.",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/providers/${activeProvider.id}/lifecycle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete" }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        financeWarning?: string | null;
      };

      if (!response.ok) {
        setDeleteError(payload.error || "Delete failed.");
        return;
      }

      if (payload.financeWarning) {
        window.alert(payload.financeWarning);
      }

      router.push("/admin/providers");
      router.refresh();
    } catch {
      setDeleteError("Delete request failed.");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleAccountStatus() {
    setError(null);
    const nextStatus =
      activeProvider.accountStatus === "active" ? "suspended" : "active";
    const result = await patchProvider(activeProvider.id, {
      accountStatus: nextStatus,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={activeProvider.clubName}
        description={`${PROVIDER_ORGANISATION_TYPE_LABELS[activeProvider.organisationType]} · Provider ID: ${activeProvider.id} · Joined ${activeProvider.joinedAt}${
          activeProvider.clubsCount > 0
            ? ` · ${activeProvider.clubsCount} linked clubs`
            : ""
        }`}
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
        <button
          type="button"
          onClick={() => setModal("edit")}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Edit account
        </button>
        <button
          type="button"
          onClick={() => setModal("plan")}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Change plan
        </button>
        <button
          type="button"
          onClick={toggleVerified}
          className={
            activeProvider.verified
              ? "rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              : "rounded-xl bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800"
          }
        >
          {activeProvider.verified ? "Unverify" : "Verify provider"}
        </button>
        <button
          type="button"
          onClick={toggleAccountStatus}
          className={
            activeProvider.accountStatus === "active"
              ? "rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
              : "rounded-xl border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          }
        >
          {activeProvider.accountStatus === "active" ? "Suspend" : "Reactivate"}
        </button>
        <button
          type="button"
          onClick={() => setModal("payment")}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Payment settings
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleDeleteProvider()}
          className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete provider"}
        </button>
      </div>

      {deleteError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {deleteError}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleDetailsSubmit}
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Provider details</h2>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Club name</span>
            <input
              name="clubName"
              defaultValue={activeProvider.clubName}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Owner name</span>
            <input
              name="ownerName"
              defaultValue={
                activeProvider.ownerName === "—" ? "" : activeProvider.ownerName
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Email</span>
            <input
              name="email"
              defaultValue={
                activeProvider.email === "—" ? "" : activeProvider.email
              }
              type="email"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Phone</span>
            <input
              name="phone"
              defaultValue={
                activeProvider.phone === "—" ? "" : activeProvider.phone
              }
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
            <p className="text-xs text-emerald-600">Details saved.</p>
          ) : null}
        </form>

        <form
          onSubmit={handleProfileSubmit}
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Public profile</h2>
          <dl className="grid gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Provider exists</dt>
              <dd className="font-medium text-zinc-900">Yes</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Public profile exists</dt>
              <dd className="font-medium text-zinc-900">
                {activeProvider.publicProfileExists ? "Yes" : "No"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Provider slug</dt>
              <dd className="font-mono text-xs text-zinc-800">
                {activeProvider.providerSlug || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Profile slug</dt>
              <dd className="font-mono text-xs text-zinc-800">
                {activeProvider.profileSlug || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Public URL</dt>
              <dd className="text-right">
                {activeProvider.publicProfileUrl ? (
                  <a
                    href={activeProvider.publicProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-violet-700 hover:text-violet-900"
                  >
                    {activeProvider.publicProfileUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Last profile repair status</dt>
              <dd className="text-right font-medium text-zinc-900">
                {activeProvider.lastProfileRepairStatus}
              </dd>
            </div>
          </dl>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Slug</span>
            <input
              name="slug"
              defaultValue={
                activeProvider.slug === "—" ? "" : activeProvider.slug
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Location</span>
            <input
              name="location"
              defaultValue={
                activeProvider.location === "—" ? "" : activeProvider.location
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Website</span>
            <input
              name="website"
              defaultValue={activeProvider.website}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Description</span>
            <textarea
              name="description"
              defaultValue={activeProvider.description}
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

      <AdminProviderPaymentControls providerId={activeProvider.id} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Payment providers</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Mode</dt>
              <dd className="text-right font-medium text-zinc-900">
                {PAYMENT_PROVIDER_MODE_LABELS[activeProvider.paymentProviderMode]}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Stripe</dt>
              <dd className="font-medium text-zinc-900">
                {formatStripeStatusLabel(activeProvider.stripeStatus)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">GoCardless</dt>
              <dd className="font-medium text-zinc-900">
                {formatGocardlessStatusLabel(activeProvider.gocardlessStatus)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Stripe account</dt>
              <dd className="font-mono text-xs text-zinc-700">
                {activeProvider.stripeAccountId || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Methods enabled</dt>
              <dd className="text-right font-medium text-zinc-900">
                {activeProvider.paymentMethodsEnabled}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Account status</dt>
              <dd className="font-medium text-zinc-900">
                {PROVIDER_ACCOUNT_STATUS_LABELS[activeProvider.accountStatus]}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900">Finance summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Total revenue</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatProviderRevenue(activeProvider)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Rolling 12-month revenue</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatMoney(activeProvider.rollingTwelveMonthRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">VAT registration number</p>
              <p className="text-lg font-bold text-zinc-900">
                {activeProvider.vatRegistrationNumber || "—"}
              </p>
            </div>
          </div>
          {activeProvider.vatFlags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeProvider.vatFlags.map((flag: AdminVatFlag) => (
                <span
                  key={flag}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
                >
                  {ADMIN_VAT_FLAG_LABELS[flag]}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-xs text-zinc-400">
            {activeProvider.totalBookings} total bookings · Plan:{" "}
            {activeProvider.subscriptionPlan}
          </p>
        </div>
      </div>

      {modal === "edit" ? (
        <EditAccountModal
          provider={activeProvider}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}

      {modal === "plan" ? (
        <ChangePlanModal
          provider={activeProvider}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}

      {modal === "payment" ? (
        <PaymentSettingsModal
          provider={activeProvider}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}
