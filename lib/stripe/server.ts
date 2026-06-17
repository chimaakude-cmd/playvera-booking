import Stripe from "stripe";
import {
  isPublishableKeyConfigured,
  isSecretKeyConfigured,
  resolveStripePublishableKey,
  resolveStripeSecretKey,
} from "./env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = resolveStripeSecretKey();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { typescript: true });
  }

  return stripeClient;
}

export { getAppBaseUrl } from "@/lib/app-url";

export function getStripeSecretKey(): string | null {
  return isSecretKeyConfigured() ? resolveStripeSecretKey() : null;
}

export function getStripePublishableKey(): string | null {
  return isPublishableKeyConfigured() ? resolveStripePublishableKey() : null;
}

export function isStripeConfigured(): boolean {
  return isSecretKeyConfigured();
}

export function isStripeClientConfigured(): boolean {
  return isPublishableKeyConfigured();
}
