import type Stripe from "stripe";
import {
  resolveSessionSubscription,
  type ResolvedSessionSubscription,
} from "@/lib/session-subscriptions/types";
import type { ClubSession } from "@/lib/sessions";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

type SubscriptionCheckoutContext = {
  subscription: ResolvedSessionSubscription;
  stripePriceId: string;
  stripeProductId: string;
};

function mapBillingInterval(
  interval: ResolvedSessionSubscription["billingInterval"],
): Stripe.PriceCreateParams.Recurring.Interval {
  return interval === "week" ? "week" : "month";
}

async function persistStripeCatalogIds(
  sessionId: string,
  productId: string,
  priceId: string,
): Promise<void> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("sessions")
    .update({
      stripe_product_id: productId,
      stripe_price_id: priceId,
      subscription_enabled: true,
    })
    .eq("id", sessionId);
}

export async function resolveStripeSubscriptionPrice(
  stripe: Stripe,
  session: ClubSession,
  ticketId?: string | null,
  existing?: { productId?: string | null; priceId?: string | null },
): Promise<SubscriptionCheckoutContext> {
  const subscription = resolveSessionSubscription(session, ticketId);
  if (!subscription) {
    throw new Error("This activity is not configured for subscription billing.");
  }

  if (existing?.priceId) {
    try {
      const price = await stripe.prices.retrieve(existing.priceId);
      if (price.active && price.unit_amount != null) {
        const expectedPence = Math.round(subscription.monthlyPrice * 100);
        if (price.unit_amount === expectedPence) {
          return {
            subscription,
            stripePriceId: existing.priceId,
            stripeProductId:
              typeof price.product === "string"
                ? price.product
                : price.product.id,
          };
        }
      }
    } catch {
      // Fall through and create a fresh price.
    }
  }

  let productId = existing?.productId?.trim() || null;

  if (productId) {
    try {
      await stripe.products.retrieve(productId);
    } catch {
      productId = null;
    }
  }

  if (!productId) {
    const product = await stripe.products.create({
      name: session.sessionTitle,
      description: session.description?.slice(0, 500) || undefined,
      metadata: {
        sessionId: session.id,
        activoraSubscription: "true",
      },
    });
    productId = product.id;
  }

  const price = await stripe.prices.create({
    currency: "gbp",
    unit_amount: Math.round(subscription.monthlyPrice * 100),
    recurring: {
      interval: mapBillingInterval(subscription.billingInterval),
    },
    product: productId,
    metadata: {
      sessionId: session.id,
      ticketId: subscription.ticketId ?? "",
    },
  });

  await persistStripeCatalogIds(session.id, productId, price.id);

  return {
    subscription,
    stripePriceId: price.id,
    stripeProductId: productId,
  };
}

export function buildSubscriptionCheckoutParams(input: {
  stripePriceId: string;
  platformFeePercent: number;
  connectedAccountId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  subscription: ResolvedSessionSubscription;
}): Stripe.Checkout.SessionCreateParams {
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData =
    {
      metadata: input.metadata,
      application_fee_percent: input.platformFeePercent,
      transfer_data: {
        destination: input.connectedAccountId,
      },
    };

  if (input.subscription.trialDays && input.subscription.trialDays > 0) {
    subscriptionData.trial_period_days = input.subscription.trialDays;
  }

  if (input.subscription.billingDay && input.subscription.billingDay >= 1) {
    (subscriptionData as Stripe.Checkout.SessionCreateParams.SubscriptionData & {
      billing_cycle_anchor_config?: { day_of_month: number };
    }).billing_cycle_anchor_config = {
      day_of_month: Math.min(28, input.subscription.billingDay),
    };
  }

  return {
    mode: "subscription",
    customer_email: input.customerEmail,
    line_items: [
      {
        price: input.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      ...input.metadata,
      checkoutMode: "subscription",
    },
    subscription_data: subscriptionData,
  };
}
