import { NextResponse } from "next/server";
import {
  getServerSubscriptionPlans,
  SubscriptionPlansStoreError,
} from "@/lib/subscription-plans/server-store";

export async function GET() {
  try {
    const plans = await getServerSubscriptionPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    if (error instanceof SubscriptionPlansStoreError) {
      const status = error.code === "not_configured" ? 503 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("[Subscription plans] Public GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load subscription plans." },
      { status: 500 },
    );
  }
}
