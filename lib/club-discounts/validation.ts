import type {
  ClubDiscount,
  DiscountFormInput,
  EarlyBirdDiscountFormInput,
  SiblingDiscountFormInput,
} from "./types";
import { calculateDiscountAmount } from "./metrics";

export const PREVIEW_BOOKING_PRICE = 25;

export type DiscountValidationError = {
  field: string;
  message: string;
};

function validateDiscountValue(
  type: DiscountFormInput["type"],
  value: number,
  samplePrice: number,
  errors: DiscountValidationError[],
  field = "value",
): void {
  if (Number.isNaN(value) || value === 0) {
    errors.push({ field, message: "Discount value is required." });
    return;
  }

  if (type === "percentage") {
    if (value <= 0 || value > 100) {
      errors.push({
        field,
        message: "Percentage must be between 1 and 100.",
      });
    }
  } else if (value <= 0) {
    errors.push({
      field,
      message: "Fixed amount must be greater than zero.",
    });
  } else if (value > samplePrice) {
    errors.push({
      field,
      message: `Fixed amount cannot exceed a typical booking price (£${samplePrice.toFixed(2)}).`,
    });
  }
}

function validateDiscountAmountAgainstBooking(
  input: Pick<DiscountFormInput, "type" | "value" | "minimumSpend" | "isActive">,
  samplePrice: number,
  errors: DiscountValidationError[],
): void {
  const draftDiscount: ClubDiscount = {
    id: "draft",
    providerId: "demo",
    kind: "promo",
    name: "Draft",
    code: "DRAFT",
    type: input.type,
    value: input.value,
    appliesTo: "all_activities",
    minimumSpend: input.minimumSpend,
    usageLimitTotal: null,
    usageLimitPerParent: null,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    canCombine: false,
    isActive: input.isActive,
    isPaused: false,
    isArchived: false,
    redemptionCount: 0,
    totalDiscountedAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const discountAmount = calculateDiscountAmount(samplePrice, draftDiscount);

  if (discountAmount <= 0 && input.isActive) {
    errors.push({
      field: "general",
      message: "Discount does not apply at the sample booking price.",
    });
  }

  if (samplePrice - discountAmount < 0) {
    errors.push({
      field: "value",
      message: "Discount cannot reduce a booking below £0.",
    });
  }
}

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateDiscountInput(
  input: DiscountFormInput,
  options?: {
    existingDiscounts?: ClubDiscount[];
    excludeId?: string;
    sampleBookingPrice?: number;
  },
): DiscountValidationError[] {
  const errors: DiscountValidationError[] = [];
  const code = normalizeDiscountCode(input.code);
  const samplePrice = options?.sampleBookingPrice ?? PREVIEW_BOOKING_PRICE;

  if (!input.name.trim()) {
    errors.push({ field: "name", message: "Discount name is required." });
  }

  if (!code) {
    errors.push({ field: "code", message: "Discount code is required." });
  } else if (code.length < 3) {
    errors.push({
      field: "code",
      message: "Code must be at least 3 characters.",
    });
  } else if (!/^[A-Z0-9_-]+$/.test(code)) {
    errors.push({
      field: "code",
      message: "Code can only contain letters, numbers, hyphens, and underscores.",
    });
  }

  const duplicate = options?.existingDiscounts?.find(
    (discount) =>
      discount.code.toUpperCase() === code &&
      discount.id !== options.excludeId &&
      !discount.isArchived,
  );

  if (duplicate) {
    errors.push({
      field: "code",
      message: "This code is already in use for your club.",
    });
  }

  validateDiscountValue(input.type, input.value, samplePrice, errors);

  if (input.minimumSpend < 0) {
    errors.push({
      field: "minimumSpend",
      message: "Minimum spend cannot be negative.",
    });
  }

  if (samplePrice < input.minimumSpend) {
    errors.push({
      field: "minimumSpend",
      message: `Minimum spend must not exceed a typical booking price (${samplePrice.toFixed(2)}).`,
    });
  }

  if (!input.startDate) {
    errors.push({ field: "startDate", message: "Start date is required." });
  }

  if (input.endDate && input.startDate && input.endDate < input.startDate) {
    errors.push({
      field: "endDate",
      message: "End date must be on or after the start date.",
    });
  }

  if (
    input.usageLimitTotal !== null &&
    (input.usageLimitTotal <= 0 || !Number.isInteger(input.usageLimitTotal))
  ) {
    errors.push({
      field: "usageLimitTotal",
      message: "Total usage limit must be a whole number greater than zero.",
    });
  }

  if (
    input.usageLimitPerParent !== null &&
    (input.usageLimitPerParent <= 0 ||
      !Number.isInteger(input.usageLimitPerParent))
  ) {
    errors.push({
      field: "usageLimitPerParent",
      message: "Per-parent usage limit must be a whole number greater than zero.",
    });
  }

  validateDiscountAmountAgainstBooking(input, samplePrice, errors);

  return errors;
}

export function validateSiblingDiscountInput(
  input: SiblingDiscountFormInput,
  options?: { sampleBookingPrice?: number },
): DiscountValidationError[] {
  const errors: DiscountValidationError[] = [];
  const samplePrice = options?.sampleBookingPrice ?? PREVIEW_BOOKING_PRICE;

  if (!input.name.trim()) {
    errors.push({ field: "name", message: "Discount name is required." });
  }

  validateDiscountValue(input.type, input.value, samplePrice, errors);

  if (
    input.appliesTo !== "all_activities" &&
    !input.appliesToLabel?.trim()
  ) {
    errors.push({
      field: "appliesToLabel",
      message: "Please specify which activities or venues this applies to.",
    });
  }

  validateDiscountAmountAgainstBooking(
    {
      type: input.type,
      value: input.value,
      minimumSpend: 0,
      isActive: input.isActive,
    },
    samplePrice,
    errors,
  );

  return errors;
}

export function validateEarlyBirdDiscountInput(
  input: EarlyBirdDiscountFormInput,
  options?: { sampleBookingPrice?: number },
): DiscountValidationError[] {
  const errors: DiscountValidationError[] = [];
  const samplePrice = options?.sampleBookingPrice ?? PREVIEW_BOOKING_PRICE;

  if (!input.name.trim()) {
    errors.push({ field: "name", message: "Discount name is required." });
  }

  if (!input.deadlineAt) {
    errors.push({
      field: "deadlineAt",
      message: "Early bird deadline is required.",
    });
  } else {
    const deadline = new Date(input.deadlineAt);
    if (Number.isNaN(deadline.getTime())) {
      errors.push({
        field: "deadlineAt",
        message: "Deadline must be a valid date and time.",
      });
    }
  }

  validateDiscountValue(input.type, input.value, samplePrice, errors);

  if (
    input.appliesTo !== "all_activities" &&
    !input.appliesToLabel?.trim()
  ) {
    errors.push({
      field: "appliesToLabel",
      message: "Please specify which activities or venues this applies to.",
    });
  }

  if (
    input.usageLimitTotal !== null &&
    (input.usageLimitTotal <= 0 || !Number.isInteger(input.usageLimitTotal))
  ) {
    errors.push({
      field: "usageLimitTotal",
      message: "Usage limit must be a whole number greater than zero.",
    });
  }

  validateDiscountAmountAgainstBooking(
    {
      type: input.type,
      value: input.value,
      minimumSpend: 0,
      isActive: input.isActive,
    },
    samplePrice,
    errors,
  );

  return errors;
}

export function isCodeUnique(
  code: string,
  discounts: ClubDiscount[],
  excludeId?: string,
): boolean {
  const normalized = normalizeDiscountCode(code);
  return !discounts.some(
    (discount) =>
      discount.code.toUpperCase() === normalized &&
      discount.id !== excludeId &&
      !discount.isArchived,
  );
}
