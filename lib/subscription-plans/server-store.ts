import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  getDefaultPlanBySlug,
  normalizePlanSlug,
} from "./defaults";
import { rowToSubscriptionPlan, updateToRowPatch } from "./mappers";
import type { Database } from "@/lib/database.types";
import type {
  PlanSlug,
  SubscriptionPlan,
  SubscriptionPlanRow,
  SubscriptionPlanUpdate,
} from "./types";

export class SubscriptionPlansStoreError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "not_found" | "database",
  ) {
    super(message);
    this.name = "SubscriptionPlansStoreError";
  }
}

type SupabaseLikeError = {
  message?: string;
  code?: string;
};

function isSubscriptionPlansTableMissingError(error: SupabaseLikeError): boolean {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code ?? "";

  if (code === "PGRST205" || code === "42P01") {
    return message.includes("subscription_plans");
  }

  if (message.includes("schema cache") && message.includes("subscription_plans")) {
    return true;
  }

  if (message.includes("could not find") && message.includes("subscription_plans")) {
    return true;
  }

  return (
    message.includes("relation") &&
    message.includes("subscription_plans") &&
    message.includes("does not exist")
  );
}

export async function getServerSubscriptionPlans(options?: {
  includeDisabled?: boolean;
}): Promise<SubscriptionPlan[]> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return DEFAULT_SUBSCRIPTION_PLANS;
  }

  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("subscription_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!options?.includeDisabled) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;

  if (error) {
    if (isSubscriptionPlansTableMissingError(error)) {
      return DEFAULT_SUBSCRIPTION_PLANS;
    }
    throw new SubscriptionPlansStoreError(error.message, "database");
  }

  if (!data?.length) {
    return DEFAULT_SUBSCRIPTION_PLANS;
  }

  return (data as SubscriptionPlanRow[]).map(rowToSubscriptionPlan);
}

export async function getServerSubscriptionPlanBySlug(
  slug: string | null | undefined,
): Promise<SubscriptionPlan> {
  const normalized = normalizePlanSlug(slug);
  const plans = await getServerSubscriptionPlans({ includeDisabled: true });
  return plans.find((plan) => plan.slug === normalized) ?? getDefaultPlanBySlug(normalized);
}

export async function updateServerSubscriptionPlan(
  slug: PlanSlug,
  update: SubscriptionPlanUpdate,
): Promise<SubscriptionPlan> {
  if (!isSupabaseConfigured()) {
    throw new SubscriptionPlansStoreError(
      "Supabase is not configured.",
      "not_configured",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const patch = updateToRowPatch(update) as Database["public"]["Tables"]["subscription_plans"]["Update"];

  const { data, error } = await supabase
    .from("subscription_plans")
    .update(patch)
    .eq("slug", slug)
    .select("*")
    .single();

  if (error) {
    throw new SubscriptionPlansStoreError(error.message, "database");
  }

  return rowToSubscriptionPlan(data as SubscriptionPlanRow);
}

export async function getServerBookingFeeForPlan(
  planRef: string | null | undefined,
): Promise<number> {
  const plan = await getServerSubscriptionPlanBySlug(planRef);
  return plan.bookingFeePercent;
}
