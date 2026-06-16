import { normalizePlanId, type PlanId } from "@/src/config/pricing";

/** Admin-facing plan options shown on the providers page. */
export type AdminProviderPlanId =
  | "FREE"
  | "STARTER"
  | "GROWTH"
  | "PRO"
  | "ENTERPRISE";

export const ADMIN_PROVIDER_PLAN_OPTIONS: {
  id: AdminProviderPlanId;
  label: string;
  storagePlanId: PlanId;
}[] = [
  { id: "FREE", label: "Free", storagePlanId: "STARTER" },
  { id: "STARTER", label: "Starter", storagePlanId: "STARTER" },
  { id: "GROWTH", label: "Growth", storagePlanId: "PRO" },
  { id: "PRO", label: "Pro", storagePlanId: "PRO" },
  { id: "ENTERPRISE", label: "Enterprise", storagePlanId: "ENTERPRISE" },
];

const ADMIN_PLAN_LABELS = Object.fromEntries(
  ADMIN_PROVIDER_PLAN_OPTIONS.map((option) => [option.id, option.label]),
) as Record<AdminProviderPlanId, string>;

export function getAdminPlanLabel(planId: AdminProviderPlanId): string {
  return ADMIN_PLAN_LABELS[planId] ?? "Starter";
}

export function storagePlanToAdminPlan(
  rawPlan: string | null | undefined,
): AdminProviderPlanId {
  const normalized = normalizePlanId(rawPlan);

  if (normalized === "ENTERPRISE") {
    return "ENTERPRISE";
  }

  if (normalized === "PRO") {
    const upper = String(rawPlan ?? "").toUpperCase();
    return upper === "GROWTH" ? "GROWTH" : "PRO";
  }

  if (normalized === "FRANCHISE") {
    return "GROWTH";
  }

  const upper = String(rawPlan ?? "").toUpperCase();
  if (upper === "FREE") {
    return "FREE";
  }

  return "STARTER";
}

export function adminPlanToStoragePlan(planId: AdminProviderPlanId): PlanId {
  const match = ADMIN_PROVIDER_PLAN_OPTIONS.find((option) => option.id === planId);
  return match?.storagePlanId ?? "STARTER";
}

export function adminPlanToStoredValue(planId: AdminProviderPlanId): string {
  if (planId === "GROWTH") {
    return "GROWTH";
  }

  return adminPlanToStoragePlan(planId);
}
