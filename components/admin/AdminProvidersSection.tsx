"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProviderRowActions } from "@/components/admin/AdminProviderActions";
import { PageHeader } from "@/components/club/PageHeader";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  adminEnvMissingLabel,
  adminLiveDataLabel,
} from "@/lib/admin/data-source";
import { buildPublicOnboardingLink } from "@/lib/admin/provider-onboarding";
import {
  PAYMENT_PROVIDER_MODE_LABELS,
  PROVIDER_ACCOUNT_STATUS_LABELS,
  PROVIDER_ORGANISATION_EMPTY_MESSAGES,
  PROVIDER_ORGANISATION_TAB_LABELS,
  type ProviderOrganisationType,
} from "@/lib/admin";
import type {
  AdminPaymentProviderMode,
  AdminProvider,
  AdminProvidersDiagnostics,
} from "@/lib/admin/types";
import { paginateItems } from "@/lib/pagination";

type Props = {
  providers: AdminProvider[];
  dataSource: "supabase" | "env_missing";
  diagnostics: AdminProvidersDiagnostics | null;
};

type StatusFilter = AdminProvider["accountStatus"] | "all";
type PaymentFilter = AdminPaymentProviderMode | "all";
type VerificationFilter = "all" | "verified" | "unverified";

const ORGANISATION_TABS: ProviderOrganisationType[] = [
  "club",
  "franchise",
  "enterprise",
];

const INPUT_CLASS =
  "rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

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

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        verified ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

function PaymentSetupCell({ provider }: { provider: AdminProvider }) {
  return (
    <div className="text-xs text-zinc-600">
      <p className="font-medium text-zinc-800">
        {PAYMENT_PROVIDER_MODE_LABELS[provider.paymentProviderMode]}
      </p>
      <p className="mt-0.5">{provider.paymentMethodsEnabled}</p>
    </div>
  );
}

function formatCreatedDate(joinedAt: string): string {
  const parsed = new Date(joinedAt);
  if (Number.isNaN(parsed.getTime())) {
    return joinedAt;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ClubRow({ provider }: { provider: AdminProvider }) {
  return (
    <tr className="transition-colors hover:bg-zinc-50/50">
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
      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
        {provider.subscriptionPlan}
      </td>
      <td className="px-4 py-4">
        <PaymentSetupCell provider={provider} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <VerificationBadge verified={provider.verified} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <AccountStatusBadge status={provider.accountStatus} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-600">
        {formatCreatedDate(provider.joinedAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <ProviderRowActions provider={provider} />
      </td>
    </tr>
  );
}

function FranchiseRow({ provider }: { provider: AdminProvider }) {
  return (
    <tr className="transition-colors hover:bg-zinc-50/50">
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
      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
        {provider.clubsCount}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
        {provider.subscriptionPlan}
      </td>
      <td className="px-4 py-4">
        <PaymentSetupCell provider={provider} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <VerificationBadge verified={provider.verified} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <AccountStatusBadge status={provider.accountStatus} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <ProviderRowActions provider={provider} />
      </td>
    </tr>
  );
}

function EnterpriseRow({ provider }: { provider: AdminProvider }) {
  return (
    <tr className="transition-colors hover:bg-zinc-50/50">
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
      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
        {provider.clubsCount}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
        {provider.subscriptionPlan}
      </td>
      <td className="px-4 py-4">
        <PaymentSetupCell provider={provider} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <VerificationBadge verified={provider.verified} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <AccountStatusBadge status={provider.accountStatus} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <ProviderRowActions provider={provider} />
      </td>
    </tr>
  );
}

const TABLE_HEADINGS: Record<ProviderOrganisationType, string[]> = {
  club: [
    "Club name",
    "Owner",
    "Plan",
    "Payment setup",
    "Verification",
    "Status",
    "Created date",
    "Actions",
  ],
  franchise: [
    "Franchise name",
    "Head office contact",
    "Number of clubs",
    "Plan",
    "Payment setup",
    "Verification",
    "Status",
    "Actions",
  ],
  enterprise: [
    "Organisation name",
    "Primary admin",
    "Sites/clubs count",
    "Plan",
    "Payment setup",
    "Verification",
    "Status",
    "Actions",
  ],
};

function ProvidersDiagnosticsPanel({
  diagnostics,
  onRepaired,
}: {
  diagnostics: AdminProvidersDiagnostics;
  onRepaired: () => void;
}) {
  const [repairingAuthUserId, setRepairingAuthUserId] = useState<string | null>(
    null,
  );
  const [repairError, setRepairError] = useState<string | null>(null);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);

  async function handleRepair(authUserId: string) {
    setRepairingAuthUserId(authUserId);
    setRepairError(null);
    setRepairMessage(null);

    try {
      const response = await fetch("/api/admin/providers/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authUserId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        providerId?: string;
        created?: boolean;
      };

      if (!response.ok) {
        setRepairError(payload.error || "Repair failed.");
        return;
      }

      setRepairMessage(
        payload.created
          ? "Provider profile created."
          : "Provider profile already exists.",
      );
      onRepaired();
    } catch {
      setRepairError("Repair request failed.");
    } finally {
      setRepairingAuthUserId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm text-zinc-700 shadow-sm">
      <p className="font-semibold text-zinc-900">Provider data diagnostics</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Total provider rows
          </dt>
          <dd className="mt-0.5 text-base font-medium text-zinc-900">
            {diagnostics.totalProviderRows}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Visible in admin
          </dt>
          <dd className="mt-0.5 text-base font-medium text-zinc-900">
            {diagnostics.totalVisibleRows}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Hidden
          </dt>
          <dd className="mt-0.5 text-base font-medium text-zinc-900">
            {diagnostics.hiddenCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Query client
          </dt>
          <dd className="mt-0.5 text-base font-medium text-zinc-900">
            {diagnostics.queryClient === "service_role"
              ? "Service role"
              : "Anon key"}
          </dd>
        </div>
      </dl>

      {diagnostics.hiddenReason ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {diagnostics.hiddenReason}
        </p>
      ) : null}

      {repairMessage ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          {repairMessage}
        </p>
      ) : null}

      {repairError ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          {repairError}
        </p>
      ) : null}

      {diagnostics.orphanedClubAuthUsers.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Club auth users without a provider row
          </p>
          <ul className="space-y-2">
            {diagnostics.orphanedClubAuthUsers.map((orphan) => (
              <li
                key={orphan.authUserId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="font-medium text-zinc-900">{orphan.name}</p>
                  <p className="text-xs text-zinc-500">{orphan.email}</p>
                </div>
                <button
                  type="button"
                  disabled={repairingAuthUserId === orphan.authUserId}
                  onClick={() => void handleRepair(orphan.authUserId)}
                  className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
                >
                  {repairingAuthUserId === orphan.authUserId
                    ? "Repairing…"
                    : "Repair provider profile"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function AdminProvidersSection({ providers, dataSource, diagnostics }: Props) {
  const [activeTab, setActiveTab] = useState<ProviderOrganisationType>("club");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [search, setSearch] = useState("");
  const [copiedOnboarding, setCopiedOnboarding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const counts = useMemo(() => {
    const tally: Record<ProviderOrganisationType, number> = {
      club: 0,
      franchise: 0,
      enterprise: 0,
    };

    for (const provider of providers) {
      tally[provider.organisationType] += 1;
    }

    return tally;
  }, [providers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return providers.filter((provider) => {
      if (provider.organisationType !== activeTab) {
        return false;
      }

      if (statusFilter !== "all" && provider.accountStatus !== statusFilter) {
        return false;
      }

      if (
        paymentFilter !== "all" &&
        provider.paymentProviderMode !== paymentFilter
      ) {
        return false;
      }

      if (verificationFilter === "verified" && !provider.verified) {
        return false;
      }

      if (verificationFilter === "unverified" && provider.verified) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        provider.clubName.toLowerCase().includes(query) ||
        provider.email.toLowerCase().includes(query) ||
        provider.ownerName.toLowerCase().includes(query)
      );
    });
  }, [
    providers,
    activeTab,
    statusFilter,
    paymentFilter,
    verificationFilter,
    search,
  ]);

  const pagination = useMemo(
    () => paginateItems(filtered, page, 10),
    [filtered, page],
  );

  const headings = TABLE_HEADINGS[activeTab];
  const isGlobalEmpty = providers.length === 0;
  const emptyMessage = isGlobalEmpty
    ? "No providers have signed up yet"
    : PROVIDER_ORGANISATION_EMPTY_MESSAGES[activeTab];

  async function handleCopyOnboardingLink() {
    await navigator.clipboard.writeText(buildPublicOnboardingLink());
    setCopiedOnboarding(true);
    setTimeout(() => setCopiedOnboarding(false), 2000);
  }

  function handleTabChange(tab: ProviderOrganisationType) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Providers"
        description="Manage clubs, franchises, and enterprise accounts — verify providers and monitor payment setup."
        action={
          dataSource === "env_missing" ? (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              {adminEnvMissingLabel()}
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
                {adminLiveDataLabel()}
              </span>
              <Link
                href="/admin/providers/invite"
                className="rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-800"
              >
                Invite provider
              </Link>
            </div>
          )
        }
      />

      {diagnostics ? (
        <ProvidersDiagnosticsPanel
          key={refreshKey}
          diagnostics={diagnostics}
          onRepaired={() => {
            setRefreshKey((value) => value + 1);
            window.location.reload();
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200">
        {ORGANISATION_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-violet-600 text-violet-800"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {PROVIDER_ORGANISATION_TAB_LABELS[tab]} ({counts[tab]})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <label className="min-w-[140px]">
          <span className="text-xs font-semibold text-zinc-600">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
            className={`mt-1 ${INPUT_CLASS}`}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>

        <label className="min-w-[160px]">
          <span className="text-xs font-semibold text-zinc-600">
            Payment provider
          </span>
          <select
            value={paymentFilter}
            onChange={(event) => {
              setPaymentFilter(event.target.value as PaymentFilter);
              setPage(1);
            }}
            className={`mt-1 ${INPUT_CLASS}`}
          >
            <option value="all">All providers</option>
            <option value="stripe_only">Stripe only</option>
            <option value="gocardless_only">GoCardless only</option>
            <option value="both">Stripe + GoCardless</option>
            <option value="not_connected">No payment provider yet</option>
          </select>
        </label>

        <label className="min-w-[140px]">
          <span className="text-xs font-semibold text-zinc-600">
            Verification
          </span>
          <select
            value={verificationFilter}
            onChange={(event) => {
              setVerificationFilter(event.target.value as VerificationFilter);
              setPage(1);
            }}
            className={`mt-1 ${INPUT_CLASS}`}
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </label>

        <label className="min-w-[200px] flex-1">
          <span className="text-xs font-semibold text-zinc-600">
            Search name or email
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Club name, owner, or email"
            className={`mt-1 w-full ${INPUT_CLASS}`}
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {headings.map((heading) => (
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
              {pagination.items.length === 0 ? (
                <tr>
                  <td colSpan={headings.length} className="px-4 py-12 text-center">
                    <p className="text-sm text-zinc-500">{emptyMessage}</p>
                    {isGlobalEmpty && dataSource === "supabase" ? (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <Link
                          href="/admin/providers/invite"
                          className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
                        >
                          Invite provider
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleCopyOnboardingLink()}
                          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {copiedOnboarding ? "Link copied" : "Copy onboarding link"}
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ) : activeTab === "club" ? (
                pagination.items.map((provider) => (
                  <ClubRow key={provider.id} provider={provider} />
                ))
              ) : activeTab === "franchise" ? (
                pagination.items.map((provider) => (
                  <FranchiseRow key={provider.id} provider={provider} />
                ))
              ) : (
                pagination.items.map((provider) => (
                  <EnterpriseRow key={provider.id} provider={provider} />
                ))
              )}
            </tbody>
          </table>
          {pagination.totalItems > 0 ? (
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
