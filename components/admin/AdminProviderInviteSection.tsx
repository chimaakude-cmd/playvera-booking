"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import {
  ADMIN_PAYMENT_SETUP_OPTIONS,
  buildPublicOnboardingLink,
  defaultPlanForOrganisationType,
  type AdminPaymentSetupOption,
} from "@/lib/admin/provider-onboarding";
import {
  ADMIN_PROVIDER_PLAN_OPTIONS,
  type AdminProviderPlanId,
} from "@/lib/admin/provider-plans";
import {
  PROVIDER_ORGANISATION_TYPE_LABELS,
  PROVIDER_ORGANISATION_TYPES,
  type ProviderOrganisationType,
} from "@/lib/admin/organisation-types";
import type { AdminListDataSource } from "@/lib/admin/data-source";
import { adminEnvMissingLabel } from "@/lib/admin/data-source";

type Props = {
  dataSource: AdminListDataSource;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2";

export function AdminProviderInviteSection({ dataSource }: Props) {
  const router = useRouter();
  const [clubName, setClubName] = useState("");
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [organisationType, setOrganisationType] =
    useState<ProviderOrganisationType>("club");
  const [planId, setPlanId] = useState<AdminProviderPlanId>("FREE");
  const [paymentSetup, setPaymentSetup] =
    useState<AdminPaymentSetupOption>("none");
  const [mode, setMode] = useState<"create" | "invite">("invite");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleOrganisationChange(type: ProviderOrganisationType) {
    setOrganisationType(type);
    setPlanId(defaultPlanForOrganisationType(type));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setOnboardingLink(null);

    try {
      const response = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName,
          email: email || undefined,
          ownerName: ownerName || undefined,
          organisationType,
          planId,
          paymentSetup,
          mode,
        }),
      });

      const payload = (await response.json()) as {
        onboardingLink?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Failed to create provider.");
        return;
      }

      setOnboardingLink(payload.onboardingLink ?? buildPublicOnboardingLink());
      setClubName("");
      setEmail("");
      setOwnerName("");
    } catch {
      setError("Failed to create provider.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (dataSource === "env_missing") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {adminEnvMissingLabel()}. Add NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "invite" ? "Invite provider" : "Create provider"}
        description="Add a club, franchise, or enterprise account and share the onboarding link."
        action={
          <Link
            href="/admin/providers"
            className="text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            Back to list
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("invite")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            mode === "invite"
              ? "bg-violet-700 text-white"
              : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Invite by email
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            mode === "create"
              ? "bg-violet-700 text-white"
              : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Create manually
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Provider name</span>
          <input
            required
            value={clubName}
            onChange={(event) => setClubName(event.target.value)}
            className={INPUT_CLASS}
            placeholder="Example Sports Club"
          />
        </label>

        {mode === "invite" ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
              placeholder="owner@example.com"
            />
          </label>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">
              Email (optional)
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
              placeholder="owner@example.com"
            />
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">
            Owner / primary contact (optional)
          </span>
          <input
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            className={INPUT_CLASS}
            placeholder="Jane Smith"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Account type</span>
          <select
            value={organisationType}
            onChange={(event) =>
              handleOrganisationChange(event.target.value as ProviderOrganisationType)
            }
            className={INPUT_CLASS}
          >
            {PROVIDER_ORGANISATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROVIDER_ORGANISATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Plan</span>
          <select
            value={planId}
            onChange={(event) =>
              setPlanId(event.target.value as AdminProviderPlanId)
            }
            className={INPUT_CLASS}
          >
            {ADMIN_PROVIDER_PLAN_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-zinc-700">
            Payment setup
          </legend>
          {ADMIN_PAYMENT_SETUP_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              <input
                type="radio"
                name="paymentSetup"
                value={option.id}
                checked={paymentSetup === option.id}
                onChange={() => setPaymentSetup(option.id)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {onboardingLink ? (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-900">
              Provider created — share the onboarding link
            </p>
            <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-zinc-700 ring-1 ring-emerald-100">
              {onboardingLink}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopyLink(onboardingLink)}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                {copied ? "Copied" : "Copy onboarding link"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/providers")}
                className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
              >
                View providers
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting
              ? "Saving…"
              : mode === "invite"
                ? "Create & invite"
                : "Create provider"}
          </button>
          <Link
            href="/admin/providers"
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
