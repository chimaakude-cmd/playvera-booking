"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ACCOUNTANT_CAN_PERMISSIONS,
  ACCOUNTANT_CANNOT_PERMISSIONS,
  cancelAccountantInvite,
  formatFinanceDate,
  getAccountantAccessState,
  inviteAccountant,
  removeAccountant,
  resendAccountantInvite,
  validateInviteAccountantInput,
  type AccountantAccess,
  type AccountantAccessState,
  type InviteAccountantInput,
} from "@/lib/club-finance";
import {
  FinanceButton,
  FinanceEmptyState,
  FinanceSection,
} from "./shared";

const inputClassName =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

const emptyInvite: InviteAccountantInput = {
  accountantName: "",
  accountantEmail: "",
  firmName: "",
  phone: "",
};

export function FinanceAccountantSection() {
  const [state, setState] = useState<AccountantAccessState | null>(null);
  const [form, setForm] = useState<InviteAccountantInput>(emptyInvite);
  const [errors, setErrors] = useState<
    Partial<Record<keyof InviteAccountantInput, string>>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setState(getAccountantAccessState());
  }, []);

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateInviteAccountantInput(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const next = inviteAccountant(form);
    setState(next);
    setForm(emptyInvite);
    setShowForm(false);
    setMessage(
      `Invite sent to ${form.accountantEmail.trim()}. Email delivery is stubbed until auth is live.`,
    );
  }

  function handleRemove() {
    if (
      !window.confirm(
        "Remove accountant access? They will no longer be able to view finance data.",
      )
    ) {
      return;
    }
    setState(removeAccountant());
    setMessage("Accountant access removed.");
  }

  function handleResend() {
    setState(resendAccountantInvite());
    setMessage("Invite resent. Email delivery is stubbed until auth is live.");
  }

  function handleCancelInvite() {
    setState(cancelAccountantInvite());
    setMessage("Pending accountant invite cancelled.");
  }

  if (!state) {
    return null;
  }

  const hasAccountant = Boolean(state.accountant);
  const hasPending = Boolean(state.pendingInvite);

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      <FinanceSection
        title="Connect your accountant"
        description="Invite your accountant to view finance reports, invoices, VAT settings, transactions, payouts, and refunds."
        action={
          !hasAccountant && !hasPending ? (
            <FinanceButton onClick={() => setShowForm(true)}>
              Invite accountant
            </FinanceButton>
          ) : null
        }
      >
        {hasAccountant && state.accountant ? (
          <AccountantCard
            accountant={state.accountant}
            onRemove={handleRemove}
          />
        ) : hasPending && state.pendingInvite ? (
          <PendingInviteCard
            invite={state.pendingInvite}
            onResend={handleResend}
            onCancel={handleCancelInvite}
          />
        ) : (
          <FinanceEmptyState
            title="No accountant connected"
            description="Invite your accountant to give them read-only access to finance data for bookkeeping and tax preparation."
            action={
              <FinanceButton onClick={() => setShowForm(true)}>
                Invite accountant
              </FinanceButton>
            }
          />
        )}
      </FinanceSection>

      {showForm && !hasAccountant ? (
        <FinanceSection
          title="Invite accountant"
          description="Your accountant will receive read-only finance access once they accept."
        >
          <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">
                Accountant name <span className="text-rose-600">*</span>
              </span>
              <input
                type="text"
                value={form.accountantName}
                onChange={(e) =>
                  setForm((c) => ({ ...c, accountantName: e.target.value }))
                }
                className={
                  errors.accountantName
                    ? `${inputClassName} border-rose-300`
                    : inputClassName
                }
              />
              {errors.accountantName ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.accountantName}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">
                Accountant email <span className="text-rose-600">*</span>
              </span>
              <input
                type="email"
                value={form.accountantEmail}
                onChange={(e) =>
                  setForm((c) => ({ ...c, accountantEmail: e.target.value }))
                }
                className={
                  errors.accountantEmail
                    ? `${inputClassName} border-rose-300`
                    : inputClassName
                }
              />
              {errors.accountantEmail ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.accountantEmail}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">
                Firm name <span className="text-rose-600">*</span>
              </span>
              <input
                type="text"
                value={form.firmName}
                onChange={(e) =>
                  setForm((c) => ({ ...c, firmName: e.target.value }))
                }
                className={
                  errors.firmName
                    ? `${inputClassName} border-rose-300`
                    : inputClassName
                }
              />
              {errors.firmName ? (
                <p className="mt-1 text-xs text-rose-600">{errors.firmName}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">
                Phone number
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((c) => ({ ...c, phone: e.target.value }))
                }
                className={inputClassName}
                placeholder="Optional"
              />
            </label>

            <div className="flex gap-2 sm:col-span-2">
              <FinanceButton type="submit">Send invite</FinanceButton>
              <FinanceButton
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
              >
                Cancel
              </FinanceButton>
            </div>
          </form>
        </FinanceSection>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <FinanceSection title="Accountant can">
          <ul className="space-y-2">
            {ACCOUNTANT_CAN_PERMISSIONS.map((permission) => (
              <li
                key={permission}
                className="flex items-center gap-2 text-sm text-zinc-700"
              >
                <span className="text-emerald-600">✓</span>
                {permission}
              </li>
            ))}
          </ul>
        </FinanceSection>

        <FinanceSection title="Accountant cannot">
          <ul className="space-y-2">
            {ACCOUNTANT_CANNOT_PERMISSIONS.map((permission) => (
              <li
                key={permission}
                className="flex items-center gap-2 text-sm text-zinc-700"
              >
                <span className="text-rose-500">✕</span>
                {permission}
              </li>
            ))}
          </ul>
        </FinanceSection>
      </div>
    </div>
  );
}

function AccountantCard({
  accountant,
  onRemove,
}: {
  accountant: AccountantAccess;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900">
              {accountant.accountantName}
            </h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Active
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{accountant.firmName}</p>
          <p className="mt-2 text-sm text-zinc-500">{accountant.accountantEmail}</p>
          {accountant.phone ? (
            <p className="text-sm text-zinc-500">{accountant.phone}</p>
          ) : null}
          {accountant.lastActiveAt ? (
            <p className="mt-2 text-xs text-zinc-400">
              Last active {formatFinanceDate(accountant.lastActiveAt)}
            </p>
          ) : null}
        </div>
        <FinanceButton variant="danger" size="sm" onClick={onRemove}>
          Remove accountant
        </FinanceButton>
      </div>
    </div>
  );
}

function PendingInviteCard({
  invite,
  onResend,
  onCancel,
}: {
  invite: AccountantAccess;
  onResend: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900">
              {invite.accountantName}
            </h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              Invite pending
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{invite.firmName}</p>
          <p className="mt-2 text-sm text-zinc-500">{invite.accountantEmail}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Invited {formatFinanceDate(invite.invitedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FinanceButton variant="secondary" size="sm" onClick={onResend}>
            Resend invite
          </FinanceButton>
          <FinanceButton variant="ghost" size="sm" onClick={onCancel}>
            Cancel invite
          </FinanceButton>
        </div>
      </div>
    </div>
  );
}
