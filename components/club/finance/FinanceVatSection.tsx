"use client";

import { FormEvent, useEffect, useState } from "react";
import { canEnableVat, getVatBlockMessage } from "@/lib/club-setup";
import {
  DEFAULT_VAT_SETTINGS,
  getVatSettings,
  MONTHLY_REVENUE_HISTORY,
  ROLLING_TWELVE_MONTH_REVENUE,
  saveVatSettings,
  validateVatSettings,
  type VatSettings,
} from "@/lib/club-finance";
import { FinanceButton, FinanceSection } from "./shared";
import { HmrcVatCard } from "./HmrcVatCard";
import { VatThresholdBanner } from "./VatThresholdBanner";

const inputClassName =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

export function FinanceVatSection() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<VatSettings>(DEFAULT_VAT_SETTINGS);
  const [errors, setErrors] = useState<
    Partial<Record<keyof VatSettings, string>>
  >({});

  useEffect(() => {
    setSettings(getVatSettings());
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized: VatSettings = {
      ...settings,
      clubAccountEmail: settings.clubAccountEmail.trim(),
      vatRegistrationNumber: settings.vatRegistrationNumber.trim(),
      addVatToBookings: settings.isVatRegistered
        ? settings.addVatToBookings
        : false,
    };

    const validation = validateVatSettings(normalized);
    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    if (normalized.addVatToBookings && !canEnableVat()) {
      setErrors({ addVatToBookings: getVatBlockMessage() });
      return;
    }

    saveVatSettings(normalized);
    setSettings(normalized);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <VatThresholdBanner rollingRevenue={ROLLING_TWELVE_MONTH_REVENUE} />

      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          VAT settings saved successfully
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FinanceSection
          title="VAT settings"
          description="Configure VAT registration and how it appears on bookings, receipts, invoices, and reports."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-zinc-700">
                Club account email <span className="text-rose-600">*</span>
              </span>
              <input
                type="email"
                required
                value={settings.clubAccountEmail}
                onChange={(e) => {
                  setSettings((c) => ({
                    ...c,
                    clubAccountEmail: e.target.value,
                  }));
                  setSaved(false);
                }}
                className={
                  errors.clubAccountEmail
                    ? `${inputClassName} border-rose-300`
                    : inputClassName
                }
                placeholder="accounts@yourclub.com"
              />
              {errors.clubAccountEmail ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.clubAccountEmail}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-400">
                  Required for invoices, statements, and finance correspondence.
                </p>
              )}
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium text-zinc-700">
                Is your business VAT registered?
              </legend>
              <div className="mt-3 flex gap-4">
                {(["yes", "no"] as const).map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"
                  >
                    <input
                      type="radio"
                      name="vatRegistered"
                      checked={
                        option === "yes"
                          ? settings.isVatRegistered
                          : !settings.isVatRegistered
                      }
                      onChange={() => {
                        setSettings((c) => ({
                          ...c,
                          isVatRegistered: option === "yes",
                          vatRegistrationNumber:
                            option === "yes" ? c.vatRegistrationNumber : "",
                          addVatToBookings:
                            option === "yes" ? c.addVatToBookings : false,
                        }));
                        setSaved(false);
                      }}
                    />
                    {option === "yes" ? "Yes" : "No"}
                  </label>
                ))}
              </div>
            </fieldset>

            {settings.isVatRegistered ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">
                    VAT registration number <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={settings.vatRegistrationNumber}
                    onChange={(e) => {
                      setSettings((c) => ({
                        ...c,
                        vatRegistrationNumber: e.target.value,
                      }));
                      setSaved(false);
                    }}
                    className={
                      errors.vatRegistrationNumber
                        ? `${inputClassName} border-rose-300`
                        : inputClassName
                    }
                    placeholder="GB123456789"
                  />
                  {errors.vatRegistrationNumber ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors.vatRegistrationNumber}
                    </p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">
                    VAT rate (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={settings.vatRatePercent}
                    onChange={(e) => {
                      setSettings((c) => ({
                        ...c,
                        vatRatePercent: Number(e.target.value),
                      }));
                      setSaved(false);
                    }}
                    className={inputClassName}
                  />
                  <p className="mt-1 text-xs text-zinc-400">Default: 20%</p>
                </label>

                <fieldset className="sm:col-span-2">
                  <legend className="text-sm font-medium text-zinc-700">
                    Add VAT to bookings?
                  </legend>
                  <div className="mt-3 flex gap-4">
                    {(["yes", "no"] as const).map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"
                      >
                        <input
                          type="radio"
                          name="addVat"
                          checked={
                            option === "yes"
                              ? settings.addVatToBookings
                              : !settings.addVatToBookings
                          }
                          onChange={() => {
                            if (option === "yes" && !canEnableVat()) {
                              setErrors({
                                addVatToBookings: getVatBlockMessage(),
                              });
                              return;
                            }
                            setSettings((c) => ({
                              ...c,
                              addVatToBookings: option === "yes",
                            }));
                            setSaved(false);
                            setErrors({});
                          }}
                        />
                        {option === "yes" ? "Yes" : "No"}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">
                    When enabled, VAT is shown on parent checkout, booking
                    confirmation, receipts, finance reports, and monthly
                    invoices.
                  </p>
                  {errors.addVatToBookings ? (
                    <p className="mt-2 text-xs text-rose-600">
                      {errors.addVatToBookings}
                    </p>
                  ) : null}
                </fieldset>
              </>
            ) : (
              <p className="sm:col-span-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                VAT is not charged when your business is not VAT registered.
              </p>
            )}
          </div>

          <div className="mt-6">
            <FinanceButton type="submit">Save VAT settings</FinanceButton>
          </div>
        </FinanceSection>
      </form>

      <FinanceSection
        title="Rolling 12-month revenue"
        description="Activora tracks taxable turnover through the platform for threshold monitoring only."
      >
        {MONTHLY_REVENUE_HISTORY.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No revenue recorded yet. Completed booking payments will appear here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MONTHLY_REVENUE_HISTORY.map((point) => (
              <div
                key={point.month}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                <p className="text-xs font-medium text-zinc-400">{point.month}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  £{point.revenue.toLocaleString("en-GB")}
                </p>
              </div>
            ))}
          </div>
        )}
      </FinanceSection>

      <HmrcVatCard />
    </div>
  );
}
