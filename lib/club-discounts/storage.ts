import {
  filterProductionClubRecords,
  isDemoClubRecordId,
  shouldShowClubDemoData,
} from "@/lib/club-demo-mode";
import type {
  ClubDiscount,
  DiscountFilters,
  DiscountFormInput,
  DiscountRedemption,
  EarlyBirdDiscountFormInput,
  SiblingDiscountFormInput,
} from "./types";
import { resolveDiscountStatus } from "./types";
import {
  DEMO_PROVIDER_ID,
  LEGACY_SEED_DISCOUNT_IDS,
  LEGACY_SEED_REDEMPTION_IDS,
} from "./defaults";
import { DEMO_DISCOUNTS, DEMO_REDEMPTIONS } from "./demo-seed";
import { normalizeDiscountCode } from "./validation";

export const DISCOUNTS_STORAGE_KEY = "activora-club-discounts";
export const REDEMPTIONS_STORAGE_KEY = "activora-club-discount-redemptions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadStoredRecords<T>(key: string): T[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredRecords<T>(key: string, records: T[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch {
    // ignore storage errors in stub
  }
}

export function isDemoDiscountRecord(discount: ClubDiscount): boolean {
  return (
    discount.providerId === DEMO_PROVIDER_ID ||
    isDemoClubRecordId(discount.id) ||
    LEGACY_SEED_DISCOUNT_IDS.has(discount.id)
  );
}

function isDemoRedemptionRecord(redemption: DiscountRedemption): boolean {
  return (
    isDemoClubRecordId(redemption.id) ||
    isDemoClubRecordId(redemption.discountId) ||
    isDemoClubRecordId(redemption.bookingId) ||
    LEGACY_SEED_REDEMPTION_IDS.has(redemption.id) ||
    LEGACY_SEED_DISCOUNT_IDS.has(redemption.discountId)
  );
}

function sanitizeStoredDiscounts(records: ClubDiscount[]): ClubDiscount[] {
  if (shouldShowClubDemoData()) {
    return records;
  }

  const cleaned = records.filter((record) => !isDemoDiscountRecord(record));
  if (cleaned.length !== records.length) {
    saveStoredRecords(DISCOUNTS_STORAGE_KEY, cleaned);
  }

  return cleaned;
}

function sanitizeStoredRedemptions(
  records: DiscountRedemption[],
): DiscountRedemption[] {
  if (shouldShowClubDemoData()) {
    return records;
  }

  const cleaned = records.filter((record) => !isDemoRedemptionRecord(record));
  if (cleaned.length !== records.length) {
    saveStoredRecords(REDEMPTIONS_STORAGE_KEY, cleaned);
  }

  return cleaned;
}

function migrateDiscount(discount: ClubDiscount): ClubDiscount {
  return {
    ...discount,
    kind: discount.kind ?? "promo",
    canCombine: discount.canCombine ?? false,
  };
}

export function getClubDiscounts(): ClubDiscount[] {
  const stored = sanitizeStoredDiscounts(
    loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY),
  ).map(migrateDiscount);

  if (stored.length > 0) {
    return filterProductionClubRecords(stored);
  }

  if (shouldShowClubDemoData()) {
    return DEMO_DISCOUNTS.map(migrateDiscount);
  }

  return [];
}

export function getDiscountRedemptions(): DiscountRedemption[] {
  const stored = sanitizeStoredRedemptions(
    loadStoredRecords<DiscountRedemption>(REDEMPTIONS_STORAGE_KEY),
  );

  if (stored.length > 0) {
    return filterProductionClubRecords(stored);
  }

  if (shouldShowClubDemoData()) {
    return DEMO_REDEMPTIONS;
  }

  return [];
}

function saveDiscounts(discounts: ClubDiscount[]): ClubDiscount[] {
  saveStoredRecords(DISCOUNTS_STORAGE_KEY, discounts);
  return discounts;
}

export function getDiscountById(id: string): ClubDiscount | undefined {
  return getClubDiscounts().find((discount) => discount.id === id);
}

function buildDiscount(
  input: Omit<DiscountFormInput, "code"> & {
    kind?: ClubDiscount["kind"];
    minChildren?: ClubDiscount["minChildren"];
    deadlineAt?: ClubDiscount["deadlineAt"];
    canCombine?: boolean;
    code?: string;
  },
  existing?: ClubDiscount,
): ClubDiscount {
  const now = new Date().toISOString();
  const kind = input.kind ?? existing?.kind ?? "promo";

  return {
    id: existing?.id ?? crypto.randomUUID(),
    providerId: existing?.providerId ?? DEMO_PROVIDER_ID,
    kind,
    name: input.name.trim(),
    code: normalizeDiscountCode(
      input.code ?? existing?.code ?? `${kind.toUpperCase()}-AUTO`,
    ),
    type: input.type,
    value: input.value,
    appliesTo: input.appliesTo,
    appliesToLabel: input.appliesToLabel?.trim() || undefined,
    minimumSpend: input.minimumSpend,
    usageLimitTotal: input.usageLimitTotal,
    usageLimitPerParent: input.usageLimitPerParent,
    startDate: input.startDate,
    endDate: input.endDate,
    minChildren: input.minChildren ?? existing?.minChildren,
    deadlineAt: input.deadlineAt ?? existing?.deadlineAt,
    canCombine: input.canCombine ?? existing?.canCombine ?? false,
    isActive: input.isActive,
    isPaused: existing?.isPaused ?? false,
    isArchived: existing?.isArchived ?? false,
    redemptionCount: existing?.redemptionCount ?? 0,
    totalDiscountedAmount: existing?.totalDiscountedAmount ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function createDiscount(input: DiscountFormInput): ClubDiscount {
  const discount = buildDiscount({ ...input, kind: "promo" });
  const discounts = [discount, ...loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY).map(migrateDiscount)];
  saveDiscounts(discounts);
  return discount;
}

export function createSiblingDiscount(
  input: SiblingDiscountFormInput,
): ClubDiscount {
  const today = new Date().toISOString().slice(0, 10);
  const discount = buildDiscount({
    name: input.name,
    code: `SIBLING-${Date.now().toString().slice(-6)}`,
    type: input.type,
    value: input.value,
    appliesTo: input.appliesTo,
    appliesToLabel: input.appliesToLabel,
    minimumSpend: 0,
    usageLimitTotal: null,
    usageLimitPerParent: null,
    startDate: today,
    endDate: null,
    isActive: input.isActive,
    kind: "sibling",
    minChildren: input.minChildren,
    canCombine: input.canCombine,
  });

  const discounts = [discount, ...loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY).map(migrateDiscount)];
  saveDiscounts(discounts);
  return discount;
}

export function createEarlyBirdDiscount(
  input: EarlyBirdDiscountFormInput,
): ClubDiscount {
  const today = new Date().toISOString().slice(0, 10);
  const deadlineDate = input.deadlineAt.slice(0, 10);
  const discount = buildDiscount({
    name: input.name,
    code: `EARLYBIRD-${Date.now().toString().slice(-6)}`,
    type: input.type,
    value: input.value,
    appliesTo: input.appliesTo,
    appliesToLabel: input.appliesToLabel,
    minimumSpend: 0,
    usageLimitTotal: input.usageLimitTotal,
    usageLimitPerParent: null,
    startDate: today,
    endDate: deadlineDate,
    isActive: input.isActive,
    kind: "early_bird",
    deadlineAt: input.deadlineAt,
    canCombine: input.canCombine,
  });

  const discounts = [discount, ...loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY).map(migrateDiscount)];
  saveDiscounts(discounts);
  return discount;
}

export function updateDiscount(
  id: string,
  input: DiscountFormInput,
): ClubDiscount {
  const discounts = loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY).map(
    migrateDiscount,
  );
  const index = discounts.findIndex((discount) => discount.id === id);

  if (index === -1) {
    throw new Error("Discount not found.");
  }

  const existing = discounts[index];
  const updated = buildDiscount(
    {
      ...input,
      kind: existing.kind,
      minChildren: existing.minChildren,
      deadlineAt: existing.deadlineAt,
      canCombine: existing.canCombine,
    },
    existing,
  );

  discounts[index] = updated;
  saveDiscounts(discounts);
  return updated;
}

export function updateSiblingDiscount(
  id: string,
  input: SiblingDiscountFormInput,
): ClubDiscount {
  const discounts = loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY).map(
    migrateDiscount,
  );
  const index = discounts.findIndex((discount) => discount.id === id);

  if (index === -1) {
    throw new Error("Discount not found.");
  }

  const existing = discounts[index];
  const today = new Date().toISOString().slice(0, 10);
  const updated = buildDiscount(
    {
      name: input.name,
      type: input.type,
      value: input.value,
      appliesTo: input.appliesTo,
      appliesToLabel: input.appliesToLabel,
      minimumSpend: 0,
      usageLimitTotal: null,
      usageLimitPerParent: null,
      startDate: existing.startDate || today,
      endDate: null,
      isActive: input.isActive,
      kind: "sibling",
      minChildren: input.minChildren,
      canCombine: input.canCombine,
    },
    existing,
  );

  discounts[index] = updated;
  saveDiscounts(discounts);
  return updated;
}

export function updateEarlyBirdDiscount(
  id: string,
  input: EarlyBirdDiscountFormInput,
): ClubDiscount {
  const discounts = loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY).map(
    migrateDiscount,
  );
  const index = discounts.findIndex((discount) => discount.id === id);

  if (index === -1) {
    throw new Error("Discount not found.");
  }

  const existing = discounts[index];
  const today = new Date().toISOString().slice(0, 10);
  const deadlineDate = input.deadlineAt.slice(0, 10);
  const updated = buildDiscount(
    {
      name: input.name,
      type: input.type,
      value: input.value,
      appliesTo: input.appliesTo,
      appliesToLabel: input.appliesToLabel,
      minimumSpend: 0,
      usageLimitTotal: input.usageLimitTotal,
      usageLimitPerParent: null,
      startDate: existing.startDate || today,
      endDate: deadlineDate,
      isActive: input.isActive,
      kind: "early_bird",
      deadlineAt: input.deadlineAt,
      canCombine: input.canCombine,
    },
    existing,
  );

  discounts[index] = updated;
  saveDiscounts(discounts);
  return updated;
}

export function duplicateDiscount(id: string): ClubDiscount {
  const source = getDiscountById(id);

  if (!source) {
    throw new Error("Discount not found.");
  }

  if (source.kind === "sibling") {
    return createSiblingDiscount({
      name: `${source.name} (copy)`,
      type: source.type,
      value: source.value,
      minChildren: source.minChildren ?? 2,
      appliesTo:
        source.appliesTo === "all_activities" ||
        source.appliesTo === "selected_activity" ||
        source.appliesTo === "selected_venue"
          ? source.appliesTo
          : "all_activities",
      appliesToLabel: source.appliesToLabel,
      canCombine: source.canCombine,
      isActive: false,
    });
  }

  if (source.kind === "early_bird") {
    return createEarlyBirdDiscount({
      name: `${source.name} (copy)`,
      type: source.type,
      value: source.value,
      deadlineAt:
        source.deadlineAt ??
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      appliesTo:
        source.appliesTo === "all_activities" ||
        source.appliesTo === "selected_activity" ||
        source.appliesTo === "selected_venue"
          ? source.appliesTo
          : "all_activities",
      appliesToLabel: source.appliesToLabel,
      usageLimitTotal: source.usageLimitTotal,
      canCombine: source.canCombine,
      isActive: false,
    });
  }

  const suffix = Date.now().toString().slice(-4);
  let code = `${source.code}-${suffix}`;
  const discounts = getClubDiscounts();

  while (!isDiscountCodeUnique(code, discounts)) {
    code = `${source.code}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  return createDiscount({
    name: `${source.name} (copy)`,
    code,
    type: source.type,
    value: source.value,
    appliesTo: source.appliesTo,
    appliesToLabel: source.appliesToLabel,
    minimumSpend: source.minimumSpend,
    usageLimitTotal: source.usageLimitTotal,
    usageLimitPerParent: source.usageLimitPerParent,
    startDate: source.startDate,
    endDate: source.endDate,
    isActive: false,
  });
}

export function pauseDiscount(id: string): ClubDiscount {
  return patchDiscount(id, (discount) => ({
    ...discount,
    isPaused: !discount.isPaused,
    updatedAt: new Date().toISOString(),
  }));
}

export function archiveDiscount(id: string): ClubDiscount {
  return patchDiscount(id, (discount) => ({
    ...discount,
    isArchived: true,
    isActive: false,
    isPaused: false,
    updatedAt: new Date().toISOString(),
  }));
}

function patchDiscount(
  id: string,
  patch: (discount: ClubDiscount) => ClubDiscount,
): ClubDiscount {
  const discounts = loadStoredRecords<ClubDiscount>(DISCOUNTS_STORAGE_KEY).map(
    migrateDiscount,
  );
  const index = discounts.findIndex((discount) => discount.id === id);

  if (index === -1) {
    throw new Error("Discount not found.");
  }

  const updated = patch(discounts[index]);
  discounts[index] = updated;
  saveDiscounts(discounts);
  return updated;
}

export function isDiscountCodeUnique(
  code: string,
  discounts: ClubDiscount[] = getClubDiscounts(),
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

export function filterDiscounts(
  discounts: ClubDiscount[],
  filters: DiscountFilters,
): ClubDiscount[] {
  const query = filters.query.trim().toLowerCase();

  return discounts.filter((discount) => {
    if (discount.isArchived && filters.status !== "archived") {
      return false;
    }

    if (filters.status !== "all") {
      const status = resolveDiscountStatus(discount);
      if (status !== filters.status) {
        return false;
      }
    }

    if (filters.type !== "all" && discount.type !== filters.type) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      discount.name.toLowerCase().includes(query) ||
      discount.code.toLowerCase().includes(query) ||
      (discount.appliesToLabel?.toLowerCase().includes(query) ?? false)
    );
  });
}

export function getRedemptionsForDiscount(
  discountId: string,
): DiscountRedemption[] {
  return getDiscountRedemptions().filter(
    (redemption) => redemption.discountId === discountId,
  );
}

export function discountToSiblingForm(
  discount: ClubDiscount,
): SiblingDiscountFormInput {
  return {
    name: discount.name,
    type: discount.type,
    value: discount.value,
    minChildren: discount.minChildren ?? 2,
    appliesTo:
      discount.appliesTo === "all_activities" ||
      discount.appliesTo === "selected_activity" ||
      discount.appliesTo === "selected_venue"
        ? discount.appliesTo
        : "all_activities",
    appliesToLabel: discount.appliesToLabel ?? "",
    canCombine: discount.canCombine,
    isActive: discount.isActive,
  };
}

export function discountToEarlyBirdForm(
  discount: ClubDiscount,
): EarlyBirdDiscountFormInput {
  const defaultDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  defaultDeadline.setMinutes(
    defaultDeadline.getMinutes() - defaultDeadline.getTimezoneOffset(),
  );

  function toDatetimeLocalValue(iso: string): string {
    const date = new Date(iso);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  return {
    name: discount.name,
    type: discount.type,
    value: discount.value,
    deadlineAt: discount.deadlineAt
      ? toDatetimeLocalValue(discount.deadlineAt)
      : defaultDeadline.toISOString().slice(0, 16),
    appliesTo:
      discount.appliesTo === "all_activities" ||
      discount.appliesTo === "selected_activity" ||
      discount.appliesTo === "selected_venue"
        ? discount.appliesTo
        : "all_activities",
    appliesToLabel: discount.appliesToLabel ?? "",
    usageLimitTotal: discount.usageLimitTotal,
    canCombine: discount.canCombine,
    isActive: discount.isActive,
  };
}
