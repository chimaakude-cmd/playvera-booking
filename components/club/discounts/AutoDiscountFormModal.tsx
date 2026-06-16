"use client";

import { FormEvent, useEffect, useState } from "react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import type {
  AutoDiscountAppliesTo,
  ClubDiscount,
  EarlyBirdDiscountFormInput,
  SiblingDiscountFormInput,
} from "@/lib/club-discounts";
import { AUTO_APPLIES_TO_LABELS } from "@/lib/club-discounts";
import {
  discountToEarlyBirdForm,
  discountToSiblingForm,
} from "@/lib/club-discounts/storage";
import {
  validateEarlyBirdDiscountInput,
  validateSiblingDiscountInput,
} from "@/lib/club-discounts/validation";
import { AutoDiscountCheckoutPreview } from "./CheckoutPreview";

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

function defaultSiblingForm(): SiblingDiscountFormInput {
  return {
    name: "Sibling discount",
    type: "percentage",
    value: 10,
    minChildren: 2,
    appliesTo: "all_activities",
    appliesToLabel: "",
    canCombine: false,
    isActive: true,
  };
}

function defaultEarlyBirdForm(): EarlyBirdDiscountFormInput {
  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  deadline.setMinutes(deadline.getMinutes() - deadline.getTimezoneOffset());

  return {
    name: "Early bird discount",
    type: "percentage",
    value: 10,
    deadlineAt: deadline.toISOString().slice(0, 16),
    appliesTo: "all_activities",
    appliesToLabel: "",
    usageLimitTotal: null,
    canCombine: false,
    isActive: true,
  };
}

type AutoDiscountFormModalProps = {
  open: boolean;
  kind: "sibling" | "early_bird";
  discount?: ClubDiscount | null;
  createTitle?: string;
  onClose: () => void;
  onSubmitSibling: (input: SiblingDiscountFormInput) => void;
  onSubmitEarlyBird: (input: EarlyBirdDiscountFormInput) => void;
};

export function AutoDiscountFormModal({
  open,
  kind,
  discount,
  createTitle,
  onClose,
  onSubmitSibling,
  onSubmitEarlyBird,
}: AutoDiscountFormModalProps) {
  const [siblingForm, setSiblingForm] = useState<SiblingDiscountFormInput>(
    defaultSiblingForm,
  );
  const [earlyBirdForm, setEarlyBirdForm] = useState<EarlyBirdDiscountFormInput>(
    defaultEarlyBirdForm,
  );
  const [errors, setErrors] = useState<string[]>([]);

  useModalDismiss(open, onClose);

  useEffect(() => {
    if (open) {
      if (discount?.kind === "sibling") {
        setSiblingForm(discountToSiblingForm(discount));
      } else if (kind === "sibling") {
        setSiblingForm(defaultSiblingForm());
      }

      if (discount?.kind === "early_bird") {
        setEarlyBirdForm(discountToEarlyBirdForm(discount));
      } else if (kind === "early_bird") {
        setEarlyBirdForm(defaultEarlyBirdForm());
      }

      setErrors([]);
    }
  }, [open, discount, kind]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (kind === "sibling") {
      const validationErrors = validateSiblingDiscountInput(siblingForm);
      if (validationErrors.length > 0) {
        setErrors(validationErrors.map((entry) => entry.message));
        return;
      }
      onSubmitSibling(siblingForm);
    } else {
      const validationErrors = validateEarlyBirdDiscountInput(earlyBirdForm);
      if (validationErrors.length > 0) {
        setErrors(validationErrors.map((entry) => entry.message));
        return;
      }
      onSubmitEarlyBird(earlyBirdForm);
    }

    onClose();
  }

  const title =
    discount != null
      ? kind === "sibling"
        ? "Edit sibling discount"
        : "Edit early bird discount"
      : (createTitle ??
        (kind === "sibling"
          ? "Create sibling discount"
          : "Create early bird discount"));

  const showAppliesToLabel =
    kind === "sibling"
      ? siblingForm.appliesTo !== "all_activities"
      : earlyBirdForm.appliesTo !== "all_activities";

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
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {kind === "sibling"
              ? "Applied automatically when the same parent books multiple children."
              : "Applied automatically when a parent books before the deadline."}
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

          {kind === "sibling" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">
                  Discount name
                </span>
                <input
                  required
                  value={siblingForm.name}
                  onChange={(event) =>
                    setSiblingForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-800">
                    Discount type
                  </span>
                  <select
                    value={siblingForm.type}
                    onChange={(event) =>
                      setSiblingForm((current) => ({
                        ...current,
                        type: event.target.value as SiblingDiscountFormInput["type"],
                      }))
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
                    step={siblingForm.type === "percentage" ? 1 : 0.01}
                    max={siblingForm.type === "percentage" ? 100 : undefined}
                    value={siblingForm.value}
                    onChange={(event) =>
                      setSiblingForm((current) => ({
                        ...current,
                        value: Number(event.target.value),
                      }))
                    }
                    className={inputClassName}
                  />
                </label>
              </div>

              <fieldset className="space-y-2 text-sm">
                <legend className="mb-1.5 font-medium text-zinc-800">
                  Applies when
                </legend>
                <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3">
                  <input
                    type="radio"
                    name="minChildren"
                    checked={siblingForm.minChildren === 2}
                    onChange={() =>
                      setSiblingForm((current) => ({
                        ...current,
                        minChildren: 2,
                      }))
                    }
                  />
                  <span>2 or more children booked</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3">
                  <input
                    type="radio"
                    name="minChildren"
                    checked={siblingForm.minChildren === 3}
                    onChange={() =>
                      setSiblingForm((current) => ({
                        ...current,
                        minChildren: 3,
                      }))
                    }
                  />
                  <span>3 or more children booked</span>
                </label>
              </fieldset>
            </>
          ) : (
            <>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">
                  Discount name
                </span>
                <input
                  required
                  value={earlyBirdForm.name}
                  onChange={(event) =>
                    setEarlyBirdForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-800">
                    Discount type
                  </span>
                  <select
                    value={earlyBirdForm.type}
                    onChange={(event) =>
                      setEarlyBirdForm((current) => ({
                        ...current,
                        type: event.target.value as EarlyBirdDiscountFormInput["type"],
                      }))
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
                    step={earlyBirdForm.type === "percentage" ? 1 : 0.01}
                    max={earlyBirdForm.type === "percentage" ? 100 : undefined}
                    value={earlyBirdForm.value}
                    onChange={(event) =>
                      setEarlyBirdForm((current) => ({
                        ...current,
                        value: Number(event.target.value),
                      }))
                    }
                    className={inputClassName}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">
                  Deadline date & time
                </span>
                <input
                  required
                  type="datetime-local"
                  value={earlyBirdForm.deadlineAt}
                  onChange={(event) =>
                    setEarlyBirdForm((current) => ({
                      ...current,
                      deadlineAt: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">
                  Usage limit (optional)
                </span>
                <input
                  type="number"
                  min={1}
                  value={earlyBirdForm.usageLimitTotal ?? ""}
                  onChange={(event) =>
                    setEarlyBirdForm((current) => ({
                      ...current,
                      usageLimitTotal: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Unlimited"
                />
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">
              Applies to
            </span>
            <select
              value={
                kind === "sibling"
                  ? siblingForm.appliesTo
                  : earlyBirdForm.appliesTo
              }
              onChange={(event) => {
                const appliesTo = event.target.value as AutoDiscountAppliesTo;
                if (kind === "sibling") {
                  setSiblingForm((current) => ({ ...current, appliesTo }));
                } else {
                  setEarlyBirdForm((current) => ({ ...current, appliesTo }));
                }
              }}
              className={inputClassName}
            >
              {(
                Object.keys(AUTO_APPLIES_TO_LABELS) as AutoDiscountAppliesTo[]
              ).map((key) => (
                <option key={key} value={key}>
                  {AUTO_APPLIES_TO_LABELS[key]}
                </option>
              ))}
            </select>
          </label>

          {showAppliesToLabel ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-800">
                Selection label
              </span>
              <input
                value={
                  kind === "sibling"
                    ? (siblingForm.appliesToLabel ?? "")
                    : (earlyBirdForm.appliesToLabel ?? "")
                }
                onChange={(event) => {
                  if (kind === "sibling") {
                    setSiblingForm((current) => ({
                      ...current,
                      appliesToLabel: event.target.value,
                    }));
                  } else {
                    setEarlyBirdForm((current) => ({
                      ...current,
                      appliesToLabel: event.target.value,
                    }));
                  }
                }}
                className={inputClassName}
                placeholder="e.g. Saturday football"
              />
            </label>
          ) : null}

          <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
            <span>
              <span className="block font-medium text-zinc-800">
                Can combine with other discounts
              </span>
              <span className="text-zinc-500">
                Allow stacking with promo codes or other offers
              </span>
            </span>
            <input
              type="checkbox"
              checked={
                kind === "sibling"
                  ? siblingForm.canCombine
                  : earlyBirdForm.canCombine
              }
              onChange={(event) => {
                if (kind === "sibling") {
                  setSiblingForm((current) => ({
                    ...current,
                    canCombine: event.target.checked,
                  }));
                } else {
                  setEarlyBirdForm((current) => ({
                    ...current,
                    canCombine: event.target.checked,
                  }));
                }
              }}
              className="h-5 w-5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
            <span>
              <span className="block font-medium text-zinc-800">Enabled</span>
              <span className="text-zinc-500">
                Parents receive this discount when rules match
              </span>
            </span>
            <input
              type="checkbox"
              checked={
                kind === "sibling"
                  ? siblingForm.isActive
                  : earlyBirdForm.isActive
              }
              onChange={(event) => {
                if (kind === "sibling") {
                  setSiblingForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }));
                } else {
                  setEarlyBirdForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }));
                }
              }}
              className="h-5 w-5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />
          </label>

          <AutoDiscountCheckoutPreview
            kind={kind}
            siblingInput={kind === "sibling" ? siblingForm : undefined}
            earlyBirdInput={kind === "early_bird" ? earlyBirdForm : undefined}
          />
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
