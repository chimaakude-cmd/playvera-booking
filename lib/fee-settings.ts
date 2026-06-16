/**
 * Club fee settings persistence (localStorage).
 *
 * Storage keys:
 * - activora-fee-settings — per-club fee handling
 * - activora-platform-fee-matrix — admin platform fee tiers by plan
 * - activora-platform-fee-audit-log — admin fee change history
 *
 * Supabase migration:
 * - Table: public.club_settings
 * - Access via: dataLayer.feeSettings
 */
import {
  DEFAULT_PLAN_ID,
  getAllPlans,
  getPlanByIdOrDefault,
  type PlanId,
} from "@/src/config/pricing";
import { getProviderSubscription } from "@/lib/provider-subscription";

export const PLATFORM_FEE_MATRIX_STORAGE_KEY = "activora-platform-fee-matrix";
export const PLATFORM_FEE_AUDIT_LOG_KEY = "activora-platform-fee-audit-log";

export const MIN_PLATFORM_FEE_PERCENT = 0;
export const MAX_PLATFORM_FEE_PERCENT = 10;

export type PlatformFeeMatrix = Record<PlanId, number>;

export type PlatformFeeTier = {
  planId: PlanId;
  label: string;
  description: string;
};

export type PlatformFeeAuditEntry = {
  id: string;
  changedBy: string;
  changedByEmail: string;
  changedAt: string;
  previous: PlatformFeeMatrix;
  next: PlatformFeeMatrix;
};

export const PLATFORM_FEE_TIERS: PlatformFeeTier[] = [
  {
    planId: "STARTER",
    label: "Free account",
    description: "Clubs on Free plan (Starter)",
  },
  {
    planId: "PRO",
    label: "Pro account",
    description: "Clubs on Pro plan",
  },
  {
    planId: "FRANCHISE",
    label: "Franchisor",
    description: "Franchisor + all managed clubs",
  },
  {
    planId: "ENTERPRISE",
    label: "Enterprise",
    description: "Enterprise organisations",
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function buildDefaultPlatformFeeMatrix(): PlatformFeeMatrix {
  const matrix = {} as PlatformFeeMatrix;
  for (const plan of getAllPlans()) {
    matrix[plan.id] = plan.platformFeePercent;
  }
  return matrix;
}

export const DEFAULT_PLATFORM_FEE_MATRIX = buildDefaultPlatformFeeMatrix();

export function validatePlatformFeePercent(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PLATFORM_FEE_PERCENT &&
    value <= MAX_PLATFORM_FEE_PERCENT
  );
}

export function validatePlatformFeeMatrix(
  matrix: Partial<PlatformFeeMatrix>,
): matrix is PlatformFeeMatrix {
  return PLATFORM_FEE_TIERS.every((tier) =>
    validatePlatformFeePercent(matrix[tier.planId] ?? NaN),
  );
}

function readPlatformFeeMatrixRaw(): PlatformFeeMatrix | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(PLATFORM_FEE_MATRIX_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PlatformFeeMatrix>;
    if (!validatePlatformFeeMatrix(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getPlatformFeeMatrix(): PlatformFeeMatrix {
  return readPlatformFeeMatrixRaw() ?? DEFAULT_PLATFORM_FEE_MATRIX;
}

export function getPlatformFeeForPlan(
  planId: PlanId | string | null | undefined,
): number {
  const normalized = getPlanByIdOrDefault(planId).id;
  return getPlatformFeeMatrix()[normalized];
}

export function savePlatformFeeMatrix(
  matrix: PlatformFeeMatrix,
  actor: { name: string; email: string },
): PlatformFeeMatrix {
  if (!validatePlatformFeeMatrix(matrix)) {
    throw new Error("Platform fee values must be between 0% and 10%.");
  }

  const previous = getPlatformFeeMatrix();
  const changed = PLATFORM_FEE_TIERS.some(
    (tier) => previous[tier.planId] !== matrix[tier.planId],
  );

  if (isBrowser()) {
    localStorage.setItem(PLATFORM_FEE_MATRIX_STORAGE_KEY, JSON.stringify(matrix));

    if (changed) {
      appendPlatformFeeAuditEntry({
        changedBy: actor.name,
        changedByEmail: actor.email,
        previous,
        next: matrix,
      });
    }
  }

  return matrix;
}

function readPlatformFeeAuditLog(): PlatformFeeAuditEntry[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(PLATFORM_FEE_AUDIT_LOG_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as PlatformFeeAuditEntry[];
  } catch {
    return [];
  }
}

function writePlatformFeeAuditLog(entries: PlatformFeeAuditEntry[]): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(PLATFORM_FEE_AUDIT_LOG_KEY, JSON.stringify(entries));
}

function appendPlatformFeeAuditEntry(input: {
  changedBy: string;
  changedByEmail: string;
  previous: PlatformFeeMatrix;
  next: PlatformFeeMatrix;
}): PlatformFeeAuditEntry {
  const entry: PlatformFeeAuditEntry = {
    id: `fee_audit_${crypto.randomUUID().slice(0, 8)}`,
    changedBy: input.changedBy,
    changedByEmail: input.changedByEmail,
    changedAt: new Date().toISOString(),
    previous: input.previous,
    next: input.next,
  };

  writePlatformFeeAuditLog([entry, ...readPlatformFeeAuditLog()]);
  return entry;
}

export function getPlatformFeeAuditLog(): PlatformFeeAuditEntry[] {
  return [...readPlatformFeeAuditLog()].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  );
}

export function resetPlatformFeeMatrix(): PlatformFeeMatrix {
  if (isBrowser()) {
    localStorage.removeItem(PLATFORM_FEE_MATRIX_STORAGE_KEY);
  }

  return DEFAULT_PLATFORM_FEE_MATRIX;
}

export function calculatePlatformFeeAmount(
  bookingAmount: number,
  feePercent: number,
): number {
  return Math.round(((bookingAmount * feePercent) / 100) * 100) / 100;
}

export type FeeHandling =
  | "provider_absorbs"
  | "fees_on_top"
  | "split_fee";

export type FeeSettings = {
  feeHandling: FeeHandling;
  platformFeePercent: number;
};

export const FEE_SETTINGS_STORAGE_KEY = "activora-fee-settings";

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  feeHandling: "provider_absorbs",
  platformFeePercent: getPlatformFeeForPlan(DEFAULT_PLAN_ID),
};

export function getFeeSettings(): FeeSettings {
  if (typeof window === "undefined") {
    return DEFAULT_FEE_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(FEE_SETTINGS_STORAGE_KEY);
    const planFee = getPlatformFeeForPlan(getProviderSubscription().planId);

    if (!raw) {
      return { ...DEFAULT_FEE_SETTINGS, platformFeePercent: planFee };
    }

    return {
      ...DEFAULT_FEE_SETTINGS,
      ...(JSON.parse(raw) as FeeSettings),
      platformFeePercent: planFee,
    };
  } catch {
    return DEFAULT_FEE_SETTINGS;
  }
}

export function saveFeeSettings(settings: FeeSettings): void {
  const planFee = getPlatformFeeForPlan(getProviderSubscription().planId);
  localStorage.setItem(
    FEE_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      ...settings,
      platformFeePercent: planFee,
    }),
  );
}

export const feeHandlingLabels: Record<FeeHandling, string> = {
  provider_absorbs: "Club absorbs fee",
  fees_on_top: "Parent pays fee",
  split_fee: "Split fee",
};

export const feeHandlingDescriptions: Record<FeeHandling, string> = {
  provider_absorbs:
    "Platform and Stripe fees are deducted from your payout. Parents pay the listed session price.",
  fees_on_top:
    "Platform and Stripe fees are added on top of the session price. Parents pay the full amount including fees.",
  split_fee:
    "Platform and Stripe fees are shared equally between the club and the parent.",
};
