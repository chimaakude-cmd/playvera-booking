"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ADMIN_PROVIDER_PLAN_OPTIONS,
  type AdminProviderPlanId,
} from "@/lib/admin/provider-plans";
import {
  organisationDashboardHref,
  PROVIDER_ORGANISATION_TYPE_LABELS,
  PROVIDER_ORGANISATION_TYPES,
  type ProviderOrganisationType,
} from "@/lib/admin/organisation-types";
import type {
  AdminProvider,
  ProviderAccountStatus,
} from "@/lib/admin/types";
import type { AdminProviderUpdatePayload } from "@/lib/admin/providers-data";

type ActionButtonProps = {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "default" | "primary" | "danger";
};

function ActionButton({ label, onClick, href, tone = "default" }: ActionButtonProps) {
  const className =
    tone === "primary"
      ? "rounded-lg bg-violet-700 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-violet-800"
      : tone === "danger"
        ? "rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"
        : "rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50";

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

async function patchProvider(
  providerId: string,
  payload: AdminProviderUpdatePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(`/api/admin/providers/${providerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? "Update failed." };
  }

  return { ok: true };
}

type ModalShellProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type EditAccountModalProps = {
  provider: AdminProvider;
  onClose: () => void;
  onSaved: () => void;
};

function EditAccountModal({ provider, onClose, onSaved }: EditAccountModalProps) {
  const [accountStatus, setAccountStatus] = useState<ProviderAccountStatus>(
    provider.accountStatus,
  );
  const [verified, setVerified] = useState(provider.verified);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await patchProvider(provider.id, { accountStatus, verified });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <ModalShell title="Edit account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Account status</span>
          <select
            value={accountStatus}
            onChange={(event) =>
              setAccountStatus(event.target.value as ProviderAccountStatus)
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={verified}
            onChange={(event) => setVerified(event.target.checked)}
          />
          Verified provider
        </label>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save account"}
        </button>
      </form>
    </ModalShell>
  );
}

type ChangePlanModalProps = {
  provider: AdminProvider;
  onClose: () => void;
  onSaved: () => void;
};

function ChangePlanModal({ provider, onClose, onSaved }: ChangePlanModalProps) {
  const [planId, setPlanId] = useState<AdminProviderPlanId>(provider.planId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await patchProvider(provider.id, { planId });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <ModalShell title="Change plan" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Plan / account type</span>
          <select
            value={planId}
            onChange={(event) => setPlanId(event.target.value as AdminProviderPlanId)}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          >
            {ADMIN_PROVIDER_PLAN_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Update plan"}
        </button>
      </form>
    </ModalShell>
  );
}

type PaymentSettingsModalProps = {
  provider: AdminProvider;
  onClose: () => void;
  onSaved: () => void;
};

function PaymentSettingsModal({
  provider,
  onClose,
  onSaved,
}: PaymentSettingsModalProps) {
  const [stripeCard, setStripeCard] = useState(provider.paymentMethodStripeCard);
  const [gocardlessDd, setGocardlessDd] = useState(provider.paymentMethodGoCardlessDd);
  const [manualInvoice, setManualInvoice] = useState(provider.paymentMethodManualInvoice);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await patchProvider(provider.id, {
      paymentMethodStripeCard: stripeCard,
      paymentMethodGoCardlessDd: gocardlessDd,
      paymentMethodManualInvoice: manualInvoice,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <ModalShell title="Payment settings" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs text-zinc-500">
          Toggle payment methods enabled for this provider.
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={stripeCard}
            onChange={(event) => setStripeCard(event.target.checked)}
          />
          Card payments (Stripe)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={gocardlessDd}
            onChange={(event) => setGocardlessDd(event.target.checked)}
          />
          Direct Debit (GoCardless)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={manualInvoice}
            onChange={(event) => setManualInvoice(event.target.checked)}
          />
          Manual invoice / BACS
        </label>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save payment settings"}
        </button>
      </form>
    </ModalShell>
  );
}

type MoveCategoryModalProps = {
  provider: AdminProvider;
  onClose: () => void;
  onSaved: () => void;
};

function MoveCategoryModal({ provider, onClose, onSaved }: MoveCategoryModalProps) {
  const [organisationType, setOrganisationType] = useState<ProviderOrganisationType>(
    provider.organisationType,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await patchProvider(provider.id, { organisationType });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <ModalShell title="Move between categories" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-zinc-500">
          Move <strong>{provider.clubName}</strong> to a different provider
          category. This changes which admin tab lists this account.
        </p>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Category</span>
          <select
            value={organisationType}
            onChange={(event) =>
              setOrganisationType(event.target.value as ProviderOrganisationType)
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          >
            {PROVIDER_ORGANISATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROVIDER_ORGANISATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Move category"}
        </button>
      </form>
    </ModalShell>
  );
}

type ProviderRowActionsProps = {
  provider: AdminProvider;
  compact?: boolean;
};

export function ProviderRowActions({
  provider,
  compact = true,
}: ProviderRowActionsProps) {
  const router = useRouter();
  const [modal, setModal] = useState<
    "edit" | "plan" | "payment" | "move" | null
  >(null);
  const [busy, setBusy] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function toggleAccountStatus() {
    setBusy(true);
    const nextStatus: ProviderAccountStatus =
      provider.accountStatus === "active" ? "suspended" : "active";

    const result = await patchProvider(provider.id, {
      accountStatus: nextStatus,
    });
    setBusy(false);

    if (result.ok) {
      refresh();
    }
  }

  const statusLabel =
    provider.accountStatus === "active" ? "Suspend" : "Reactivate";

  const dashboardHref = organisationDashboardHref(provider.organisationType);

  return (
    <>
      <div className={`flex ${compact ? "flex-wrap gap-2" : "flex-wrap gap-2"}`}>
        <ActionButton label="View" href={`/admin/providers/${provider.id}`} />
        <ActionButton label="Edit" onClick={() => setModal("edit")} />
        <ActionButton label="Change plan" onClick={() => setModal("plan")} />
        <ActionButton
          label={statusLabel}
          onClick={toggleAccountStatus}
          tone={provider.accountStatus === "active" ? "danger" : "default"}
        />
        <ActionButton
          label="Payment settings"
          onClick={() => setModal("payment")}
        />
        <ActionButton
          label="Move category"
          onClick={() => setModal("move")}
        />
        <ActionButton
          label="View org dashboard"
          href={dashboardHref}
        />
      </div>

      {busy ? (
        <p className="mt-1 text-[10px] text-zinc-400">Updating…</p>
      ) : null}

      {modal === "edit" ? (
        <EditAccountModal
          provider={provider}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}

      {modal === "plan" ? (
        <ChangePlanModal
          provider={provider}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}

      {modal === "payment" ? (
        <PaymentSettingsModal
          provider={provider}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}

      {modal === "move" ? (
        <MoveCategoryModal
          provider={provider}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}
    </>
  );
}

export {
  EditAccountModal,
  ChangePlanModal,
  PaymentSettingsModal,
  MoveCategoryModal,
  patchProvider,
};
