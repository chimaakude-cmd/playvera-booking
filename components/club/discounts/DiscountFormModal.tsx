"use client";

import { FormEvent, useEffect, useState } from "react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import type { ClubDiscount, DiscountFormInput } from "@/lib/club-discounts";
import { APPLIES_TO_LABELS } from "@/lib/club-discounts";
import { validateDiscountInput } from "@/lib/club-discounts/validation";
import { CheckoutPreview } from "./CheckoutPreview";

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

function toFormInput(
  discount?: ClubDiscount | null,
  preset?: Partial<DiscountFormInput>,
): DiscountFormInput {
  if (!discount) {
    const today = new Date().toISOString().slice(0, 10);
    const defaults: DiscountFormInput = {
      name: "",
      code: "",
      type: "percentage",
      value: 10,
      appliesTo: "all_activities",
      appliesToLabel: "",
      minimumSpend: 0,
      usageLimitTotal: null,
      usageLimitPerParent: 1,
      startDate: today,
      endDate: null,
      isActive: true,
    };

    return {
      ...defaults,
      ...preset,
      startDate: preset?.startDate ?? defaults.startDate,
    };
  }

  return {
    name: discount.name,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    appliesTo: discount.appliesTo,
    appliesToLabel: discount.appliesToLabel ?? "",
    minimumSpend: discount.minimumSpend,
    usageLimitTotal: discount.usageLimitTotal,
    usageLimitPerParent: discount.usageLimitPerParent,
    startDate: discount.startDate,
    endDate: discount.endDate,
    isActive: discount.isActive,
  };
}

type DiscountFormModalProps = {
  open: boolean;
  discount?: ClubDiscount | null;
  existingDiscounts: ClubDiscount[];
  preset?: Partial<DiscountFormInput>;
  createTitle?: string;
  onClose: () => void;
  onSubmit: (input: DiscountFormInput) => void;
};

export function DiscountFormModal({
  open,
  discount,
  existingDiscounts,
  preset,
  createTitle,
  onClose,
  onSubmit,
}: DiscountFormModalProps) {
  const [form, setForm] = useState<DiscountFormInput>(() =>
    toFormInput(discount, preset),
  );
  const [errors, setErrors] = useState<string[]>([]);

  useModalDismiss(open, onClose);

  useEffect(() => {
    if (open) {
      setForm(toFormInput(discount, preset));
      setErrors([]);
    }
  }, [open, discount, preset]);

  if (!open) {
    return null;
  }

  function updateField<K extends keyof DiscountFormInput>(
    key: K,
    value: DiscountFormInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateDiscountInput(form, {
      existingDiscounts,
      excludeId: discount?.id,
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((entry) => entry.message));
      return;
    }

    onSubmit(form);
    onClose();
  }

  const showAppliesToLabel =
    form.appliesTo === "selected_activity" ||
    form.appliesTo === "selected_session" ||
    form.appliesTo === "selected_venue";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close discount form"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl"
      >
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            {discount ? "Edit discount" : (createTitle ?? "Create discount")}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Codes must be unique per club. Discounts cannot reduce a booking below
            £0.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {errors.length > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <ul className="list-disc space-y-1 pl-4">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Discount name
            </span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputClassName}
              placeholder="e.g. Holiday camp early bird"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Discount code
            </span>
            <input
              required
              value={form.code}
              onChange={(event) =>
                updateField("code", event.target.value.toUpperCase())
              }
              className={`${inputClassName} font-mono uppercase`}
              placeholder="e.g. CAMP10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Discount type
              </span>
              <select
                value={form.type}
                onChange={(event) =>
                  updateField(
                    "type",
                    event.target.value as DiscountFormInput["type"],
                  )
                }
                className={inputClassName}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Discount value
              </span>
              <input
                required
                type="number"
                min={0}
                step={form.type === "percentage" ? 1 : 0.01}
                max={form.type === "percentage" ? 100 : undefined}
                value={form.value}
                onChange={(event) =>
                  updateField("value", Number(event.target.value))
                }
                className={inputClassName}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Applies to
            </span>
            <select
              value={form.appliesTo}
              onChange={(event) =>
                updateField(
                  "appliesTo",
                  event.target.value as DiscountFormInput["appliesTo"],
                )
              }
              className={inputClassName}
            >
              {(Object.keys(APPLIES_TO_LABELS) as DiscountFormInput["appliesTo"][]).map(
                (key) => (
                  <option key={key} value={key}>
                    {APPLIES_TO_LABELS[key]}
                  </option>
                ),
              )}
            </select>
          </label>

          {showAppliesToLabel ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Selection label
              </span>
              <input
                value={form.appliesToLabel ?? ""}
                onChange={(event) =>
                  updateField("appliesToLabel", event.target.value)
                }
                className={inputClassName}
                placeholder="e.g. Saturday football"
              />
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Minimum spend (£)
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.minimumSpend}
                onChange={(event) =>
                  updateField("minimumSpend", Number(event.target.value))
                }
                className={inputClassName}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Usage limit (total)
              </span>
              <input
                type="number"
                min={1}
                value={form.usageLimitTotal ?? ""}
                onChange={(event) =>
                  updateField(
                    "usageLimitTotal",
                    event.target.value
                      ? Number(event.target.value)
                      : null,
                  )
                }
                className={inputClassName}
                placeholder="Unlimited"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Usage limit (per parent)
              </span>
              <input
                type="number"
                min={1}
                value={form.usageLimitPerParent ?? ""}
                onChange={(event) =>
                  updateField(
                    "usageLimitPerParent",
                    event.target.value
                      ? Number(event.target.value)
                      : null,
                  )
                }
                className={inputClassName}
                placeholder="Unlimited"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Start date
              </span>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                End date
              </span>
              <input
                type="date"
                value={form.endDate ?? ""}
                onChange={(event) =>
                  updateField("endDate", event.target.value || null)
                }
                className={inputClassName}
              />
            </label>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
            <span>
              <span className="block font-medium text-zinc-800">Active</span>
              <span className="text-zinc-500">
                Parents can redeem this code when active
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
              className="h-5 w-5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />
          </label>

          <CheckoutPreview input={form} />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {discount ? "Save changes" : "Create discount"}
          </button>
        </div>
      </form>
    </div>
  );
}
