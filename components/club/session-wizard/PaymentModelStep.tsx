"use client";

import { Check } from "lucide-react";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import type { WizardFormData } from "@/lib/session-wizard";
import {
  SESSION_PAYMENT_MODEL_LABELS,
  SUBSCRIPTION_BILLING_FREQUENCY_LABELS,
  SUBSCRIPTION_CANCELLATION_LABELS,
  SUBSCRIPTION_JOINING_OPTION_LABELS,
  type SessionPaymentModel,
  type SessionSubscriptionConfig,
} from "@/lib/session-wizard/payment-model";
import { ActivityPaymentProviderFields } from "./ActivityPaymentProviderFields";
import {
  WizardField,
  wizardInputClassName,
  wizardLabelClassName,
} from "./shared";

type PaymentModelStepProps = {
  data: Pick<
    WizardFormData,
    "paymentModel" | "subscriptionConfig" | "paymentProvider"
  >;
  onChange: (updates: Partial<WizardFormData>) => void;
};

function OptionCard({
  selected,
  onSelect,
  title,
  useFor,
  parentPays,
  examples,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  useFor: string;
  parentPays: string;
  examples: string[];
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-2xl border p-6 text-left transition-all ${
        selected
          ? "border-[#F87128] bg-orange-50/80 ring-2 ring-[#F87128]/25 shadow-sm"
          : "border-orange-100/80 bg-white hover:border-orange-200 hover:bg-[#FFFBF7]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold text-[#0F172A]">{title}</p>
        {badge ? (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: ACTIVORA_ACTION }}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3 text-sm text-zinc-600">
        <p>
          <span className="font-medium text-zinc-800">Use for: </span>
          {useFor}
        </p>
        <p>
          <span className="font-medium text-zinc-800">Parent pays: </span>
          {parentPays}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Examples
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {examples.map((example) => (
            <li
              key={example}
              className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#C2410C]"
            >
              {example}
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-orange-100/80 bg-white p-4">
      <span>
        <span className="block text-sm font-medium text-zinc-900">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#F87128]" : "bg-zinc-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function SessionSubscriptionSetup({
  config,
  onChange,
}: {
  config: SessionSubscriptionConfig;
  onChange: (updates: Partial<SessionSubscriptionConfig>) => void;
}) {
  return (
    <div className="mt-6 space-y-5 rounded-2xl border border-orange-100 bg-[#FFFBF7] p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold text-[#0F172A]">
          Subscription setup for this activity
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Configure how parents are billed for this session. These settings apply
          only to this activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WizardField label="Subscription amount (£)" htmlFor="subscription-amount">
          <input
            id="subscription-amount"
            type="number"
            min={0}
            step={0.01}
            value={config.amount || ""}
            onChange={(event) =>
              onChange({ amount: Number(event.target.value) || 0 })
            }
            className={wizardInputClassName}
            placeholder="e.g. 45"
          />
        </WizardField>

        <WizardField label="Billing frequency" htmlFor="billing-frequency">
          <select
            id="billing-frequency"
            value={config.billingFrequency}
            onChange={(event) =>
              onChange({
                billingFrequency: event.target
                  .value as SessionSubscriptionConfig["billingFrequency"],
              })
            }
            className={wizardInputClassName}
          >
            {(
              Object.entries(SUBSCRIPTION_BILLING_FREQUENCY_LABELS) as Array<
                [SessionSubscriptionConfig["billingFrequency"], string]
              >
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </WizardField>
      </div>

      <fieldset className="space-y-3">
        <legend className={wizardLabelClassName}>Collection date</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-100/80 bg-white p-4">
            <input
              type="radio"
              name="collection-date"
              checked={config.collectionDate === "first_of_month"}
              onChange={() =>
                onChange({
                  collectionDate: "first_of_month",
                  customCollectionDay: null,
                })
              }
              className="text-[#F87128] focus:ring-[#F87128]"
            />
            <span className="text-sm text-zinc-800">1st of the month</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-100/80 bg-white p-4">
            <input
              type="radio"
              name="collection-date"
              checked={config.collectionDate === "custom"}
              onChange={() =>
                onChange({
                  collectionDate: "custom",
                  customCollectionDay: config.customCollectionDay ?? 15,
                })
              }
              className="text-[#F87128] focus:ring-[#F87128]"
            />
            <span className="text-sm text-zinc-800">Custom day</span>
          </label>
        </div>
        {config.collectionDate === "custom" ? (
          <WizardField label="Day of month (1–28)" htmlFor="custom-collection-day">
            <input
              id="custom-collection-day"
              type="number"
              min={1}
              max={28}
              value={config.customCollectionDay ?? ""}
              onChange={(event) =>
                onChange({
                  customCollectionDay: Number(event.target.value) || null,
                })
              }
              className={wizardInputClassName}
            />
          </WizardField>
        ) : null}
      </fieldset>

      <WizardField label="Joining options" htmlFor="joining-option">
        <select
          id="joining-option"
          value={config.joiningOption}
          onChange={(event) =>
            onChange({
              joiningOption: event.target
                .value as SessionSubscriptionConfig["joiningOption"],
            })
          }
          className={wizardInputClassName}
        >
          {(
            Object.entries(SUBSCRIPTION_JOINING_OPTION_LABELS) as Array<
              [SessionSubscriptionConfig["joiningOption"], string]
            >
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </WizardField>

      <WizardField label="Cancellation" htmlFor="cancellation-policy">
        <select
          id="cancellation-policy"
          value={config.cancellationPolicy}
          onChange={(event) =>
            onChange({
              cancellationPolicy: event.target
                .value as SessionSubscriptionConfig["cancellationPolicy"],
            })
          }
          className={wizardInputClassName}
        >
          {(
            Object.entries(SUBSCRIPTION_CANCELLATION_LABELS) as Array<
              [SessionSubscriptionConfig["cancellationPolicy"], string]
            >
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </WizardField>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleField
          label="Pause subscription"
          description="Allow parents to pause their subscription"
          checked={config.pauseEnabled}
          onChange={(pauseEnabled) => onChange({ pauseEnabled })}
        />
        <ToggleField
          label="Retry failed payments"
          description="Automatically retry when a payment fails"
          checked={config.retryFailedPayments}
          onChange={(retryFailedPayments) => onChange({ retryFailedPayments })}
        />
      </div>

      <div className="rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">Provider payout</p>
        <p className="mt-1">
          Follows your provider payout settings in Finance.
        </p>
      </div>

      <p className="flex items-start gap-2 text-sm text-zinc-600">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F87128]" aria-hidden />
        Subscriptions create automatic recurring payments until cancelled.
      </p>
    </div>
  );
}

export function PaymentModelStep({ data, onChange }: PaymentModelStepProps) {
  function selectPaymentModel(model: SessionPaymentModel) {
    onChange({ paymentModel: model });
  }

  function updateSubscriptionConfig(updates: Partial<SessionSubscriptionConfig>) {
    onChange({
      subscriptionConfig: {
        ...data.subscriptionConfig,
        ...updates,
      },
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F87128]">
          Activora
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[#0F172A] sm:text-2xl">
          How would you like parents to pay for THIS activity?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          This choice applies to this session only. You can set up session
          details, schedule, and tickets in the next steps.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OptionCard
          selected={data.paymentModel === "block_individual"}
          onSelect={() => selectPaymentModel("block_individual")}
          title={SESSION_PAYMENT_MODEL_LABELS.block_individual}
          useFor="Holiday camps, trial sessions, courses, weekly pay-as-you-go, block bookings"
          parentPays="Once per booking"
          examples={["£8 per session", "£40 for 5 weeks", "£120 camp"]}
        />
        <OptionCard
          selected={data.paymentModel === "subscription"}
          onSelect={() => selectPaymentModel("subscription")}
          title={SESSION_PAYMENT_MODEL_LABELS.subscription}
          useFor="Football training, development centres, monthly memberships, ongoing activities, wraparound care"
          parentPays="Recurring automatically"
          examples={["£20/month", "£45/month", "£75/month"]}
          badge="Recommended for regular clubs"
        />
      </div>

      {data.paymentModel === "subscription" ? (
        <>
          <ActivityPaymentProviderFields
            value={data.paymentProvider}
            onChange={(paymentProvider) => onChange({ paymentProvider })}
          />
          <SessionSubscriptionSetup
            config={data.subscriptionConfig}
            onChange={updateSubscriptionConfig}
          />
        </>
      ) : null}
    </section>
  );
}
