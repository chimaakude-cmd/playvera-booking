import type {
  DiscountFormInput,
  EarlyBirdDiscountFormInput,
  SiblingDiscountFormInput,
} from "@/lib/club-discounts";
import {
  APPLIES_TO_LABELS,
  AUTO_APPLIES_TO_LABELS,
  calculateDiscountAmount,
} from "@/lib/club-discounts";
import { PREVIEW_BOOKING_PRICE } from "@/lib/club-discounts/validation";
import { formatMoney } from "@/lib/payments";

type CheckoutPreviewProps = {
  input: DiscountFormInput;
  activityName?: string;
  bookingPrice?: number;
};

type AutoDiscountCheckoutPreviewProps = {
  kind: "sibling" | "early_bird";
  siblingInput?: SiblingDiscountFormInput;
  earlyBirdInput?: EarlyBirdDiscountFormInput;
  activityName?: string;
  bookingPrice?: number;
};

function buildDraftDiscount(
  type: DiscountFormInput["type"],
  value: number,
  isActive: boolean,
) {
  return {
    type,
    value,
    minimumSpend: 0,
    isActive,
    isPaused: false,
    isArchived: false,
  };
}

function getAppliesLabel(
  appliesTo: DiscountFormInput["appliesTo"] | SiblingDiscountFormInput["appliesTo"],
  appliesToLabel?: string,
): string {
  return (
    appliesToLabel?.trim() ||
    AUTO_APPLIES_TO_LABELS[
      appliesTo as keyof typeof AUTO_APPLIES_TO_LABELS
    ] ||
    APPLIES_TO_LABELS[appliesTo as keyof typeof APPLIES_TO_LABELS] ||
    "All activities"
  );
}

function getValueLabel(type: DiscountFormInput["type"], value: number): string {
  return type === "percentage"
    ? `${value || 0}% off`
    : formatMoney(value || 0);
}

export function AutoDiscountCheckoutPreview({
  kind,
  siblingInput,
  earlyBirdInput,
  activityName = "Saturday football",
  bookingPrice = PREVIEW_BOOKING_PRICE,
}: AutoDiscountCheckoutPreviewProps) {
  const input = kind === "sibling" ? siblingInput : earlyBirdInput;

  if (!input) {
    return null;
  }

  const draftDiscount = buildDraftDiscount(input.type, input.value, input.isActive);
  const discountAmount = calculateDiscountAmount(bookingPrice, draftDiscount);
  const finalAmount = Math.max(bookingPrice - discountAmount, 0);
  const appliesLabel = getAppliesLabel(input.appliesTo, input.appliesToLabel);
  const valueLabel = getValueLabel(input.type, input.value);

  const siblingEligible =
    kind === "sibling" &&
    siblingInput != null &&
    siblingInput.isActive &&
    discountAmount > 0;

  const earlyBirdEligible =
    kind === "early_bird" &&
    earlyBirdInput != null &&
    earlyBirdInput.isActive &&
    earlyBirdInput.deadlineAt &&
    new Date(earlyBirdInput.deadlineAt) > new Date() &&
    discountAmount > 0;

  const applied = siblingEligible || earlyBirdEligible;
  const appliedLabel =
    kind === "sibling"
      ? "Sibling discount applied"
      : "Early bird discount applied";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Checkout preview
        </p>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{activityName}</p>
          <p className="mt-1 text-xs text-zinc-500">{appliesLabel}</p>
          {kind === "sibling" && siblingInput ? (
            <p className="mt-1 text-xs text-zinc-500">
              Demo: parent booking {siblingInput.minChildren} children
            </p>
          ) : null}
          {kind === "early_bird" && earlyBirdInput?.deadlineAt ? (
            <p className="mt-1 text-xs text-zinc-500">
              Demo: booking before{" "}
              {new Date(earlyBirdInput.deadlineAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Session price</span>
              <span>{formatMoney(bookingPrice)}</span>
            </div>
            {applied ? (
              <>
                <div className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">
                  {appliedLabel}
                </div>
                <div className="flex justify-between font-medium text-teal-700">
                  <span>{appliedLabel} — {valueLabel}</span>
                  <span>-{formatMoney(discountAmount)}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-amber-700">
                {input.isActive
                  ? "Discount not applied — check value or deadline rules."
                  : "Discount is disabled."}
              </p>
            )}
            <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold text-zinc-900">
              <span>Total due</span>
              <span>{formatMoney(applied ? finalAmount : bookingPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Receipt preview
        </p>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Booking receipt</p>
          <p className="mt-1 text-xs text-zinc-500">Ref: PV-2026-PREVIEW</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Activity</dt>
              <dd className="text-right font-medium text-zinc-900">
                {activityName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Subtotal</dt>
              <dd className="text-zinc-900">{formatMoney(bookingPrice)}</dd>
            </div>
            {applied ? (
              <div className="flex justify-between gap-4 text-teal-700">
                <dt>{appliedLabel}</dt>
                <dd>-{formatMoney(discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2 font-semibold text-zinc-900">
              <dt>Paid</dt>
              <dd>{formatMoney(applied ? finalAmount : bookingPrice)}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Automatic discounts apply at checkout when eligibility rules are met.
        </p>
      </div>
    </div>
  );
}

export function CheckoutPreview({
  input,
  activityName = "Saturday football",
  bookingPrice = PREVIEW_BOOKING_PRICE,
}: CheckoutPreviewProps) {
  const draftDiscount = buildDraftDiscount(
    input.type,
    input.value,
    input.isActive,
  );

  const discountAmount = calculateDiscountAmount(bookingPrice, draftDiscount);
  const finalAmount = Math.max(bookingPrice - discountAmount, 0);
  const code = input.code.trim().toUpperCase() || "YOURCODE";
  const appliesLabel = getAppliesLabel(input.appliesTo, input.appliesToLabel);
  const valueLabel = getValueLabel(input.type, input.value);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Checkout preview
        </p>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{activityName}</p>
          <p className="mt-1 text-xs text-zinc-500">{appliesLabel}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Session price</span>
              <span>{formatMoney(bookingPrice)}</span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex justify-between font-medium text-teal-700">
                <span>
                  Discount ({code}) — {valueLabel}
                </span>
                <span>-{formatMoney(discountAmount)}</span>
              </div>
            ) : (
              <p className="text-xs text-amber-700">
                Discount not applied — check minimum spend or active status.
              </p>
            )}
            <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold text-zinc-900">
              <span>Total due</span>
              <span>{formatMoney(finalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Receipt preview
        </p>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Booking receipt</p>
          <p className="mt-1 text-xs text-zinc-500">Ref: PV-2026-PREVIEW</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Activity</dt>
              <dd className="text-right font-medium text-zinc-900">
                {activityName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Subtotal</dt>
              <dd className="text-zinc-900">{formatMoney(bookingPrice)}</dd>
            </div>
            {discountAmount > 0 ? (
              <div className="flex justify-between gap-4 text-teal-700">
                <dt>
                  Promo code <span className="font-mono">{code}</span>
                </dt>
                <dd>-{formatMoney(discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2 font-semibold text-zinc-900">
              <dt>Paid</dt>
              <dd>{formatMoney(finalAmount)}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Redemption records track the parent, booking reference, and discount
          amount applied.
        </p>
      </div>
    </div>
  );
}
