"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { LanguageSettingsSection } from "@/components/i18n/LanguageSettingsSection";
import { FranchisorFeeSettingsForm } from "@/components/organisation/finance/FranchisorFeeSettingsForm";
import { PayoutScheduleForm } from "@/components/organisation/finance/PayoutScheduleForm";
import {
  FRANCHISEE_SETTING_LABELS,
  FRANCHISOR_ONLY_CONTROLS,
  getOrganisation,
  getPermissionPolicy,
  updatePermissionPolicy,
  type FranchiseeEditableSetting,
  type Organisation,
  type OrganisationPermissionPolicy,
} from "@/lib/organisation";

function PlanField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{value}</p>
    </div>
  );
}

export default function OrganisationSettingsPage() {
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [policy, setPolicy] = useState<OrganisationPermissionPolicy | null>(
    null,
  );

  useEffect(() => {
    setOrganisation(getOrganisation());
    setPolicy(getPermissionPolicy());
  }, []);

  function toggleSetting(setting: FranchiseeEditableSetting) {
    if (!policy) {
      return;
    }
    const next = updatePermissionPolicy({
      ...policy.franchiseeCanEdit,
      [setting]: !policy.franchiseeCanEdit[setting],
    });
    setPolicy(next);
  }

  function togglePayoutControl() {
    if (!policy) {
      return;
    }
    const next = updatePermissionPolicy(policy.franchiseeCanEdit, {
      payoutScheduleControlledByFranchisor:
        !policy.payoutScheduleControlledByFranchisor,
    });
    setPolicy(next);
  }

  const settings = policy
    ? (Object.keys(policy.franchiseeCanEdit) as FranchiseeEditableSetting[])
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisation settings"
        description="Configure franchisor controls, franchisee permissions, and organisation billing."
      />

      <LanguageSettingsSection />

      {policy ? (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Permission policy
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Choose what franchisee club managers can edit in their club
            dashboard. Locked settings show a franchisor-only message.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {settings.map((setting) => (
              <label
                key={setting}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3"
              >
                <span className="text-sm text-zinc-700">
                  Franchisee can edit: {FRANCHISEE_SETTING_LABELS[setting]}
                </span>
                <input
                  type="checkbox"
                  checked={policy.franchiseeCanEdit[setting]}
                  onChange={() => toggleSetting(setting)}
                  className="h-4 w-4 rounded border-zinc-300 text-violet-600"
                />
              </label>
            ))}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 sm:col-span-2">
              <span className="text-sm text-zinc-700">
                Franchisor controls franchisee payout schedule
              </span>
              <input
                type="checkbox"
                checked={policy.payoutScheduleControlledByFranchisor}
                onChange={togglePayoutControl}
                className="h-4 w-4 rounded border-zinc-300 text-violet-600"
              />
            </label>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Franchisee payout schedule
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Group-wide payout timing for all franchisee clubs. Also editable from
          the Finance page.
        </p>
        <div className="mt-5">
          <PayoutScheduleForm compact />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Franchisor fee settings
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Fees retained by your organisation before franchisee payouts.
        </p>
        <div className="mt-5">
          <FranchisorFeeSettingsForm compact />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Franchisor-only controls
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          These actions are reserved for franchisor organisation users and cannot
          be delegated to franchisee club managers.
        </p>
        <ul className="mt-4 space-y-2">
          {FRANCHISOR_ONLY_CONTROLS.map((control) => (
            <li
              key={control}
              className="flex items-start gap-2 text-sm text-zinc-700"
            >
              <span className="mt-0.5 text-violet-600">●</span>
              {control}
            </li>
          ))}
        </ul>
      </section>

      {organisation ? (
        <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-6">
          <h2 className="text-lg font-semibold text-violet-900">
            Franchisor plans
          </h2>
          <p className="mt-1 text-sm text-violet-700/80">
            Pricing placeholder — managing multiple clubs adds platform costs on
            top of individual club subscriptions. Final pricing not yet
            confirmed.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PlanField label="Plan name" value={organisation.plan.planName} />
            <PlanField
              label="Monthly fee"
              value={`£${(organisation.plan.monthlyFeePence / 100).toFixed(0)} / month (TBC)`}
            />
            <PlanField
              label="Included clubs"
              value={String(organisation.plan.includedClubs)}
            />
            <PlanField
              label="Extra club fee"
              value={`£${(organisation.plan.extraClubFeePence / 100).toFixed(0)} / club / month (TBC)`}
            />
            <PlanField
              label="Activora platform fee"
              value="2.5% per transaction (standard)"
            />
            <PlanField
              label="Billing status"
              value={organisation.plan.billingStatus}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Report a bug</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Something not working in your organisation dashboard? Tell the
          Activora team.
        </p>
        <Link
          href="/report-bug?url=/organisation/settings"
          className="mt-4 inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
        >
          Report a bug
        </Link>
      </section>
    </div>
  );
}
