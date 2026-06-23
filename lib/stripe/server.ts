import Stripe from "stripe";
import {
  isPublishableKeyConfigured,
  isSecretKeyConfigured,
  resolveStripePublishableKey,
  resolveStripeSecretKey,
  validateStripePublishableKey,
  validateStripeSecretKey,
} from "./env";
import { getResolvedStripeEnv } from "./platform-admin/resolve";

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

function createStripeClient(secretKey: string): Stripe {
  if (stripeClient && stripeClientKey === secretKey) {
    return stripeClient;
  }

  stripeClient = new Stripe(secretKey, { typescript: true });
  stripeClientKey = secretKey;
  return stripeClient;
}

export async function getStripe(): Promise<Stripe> {
  const resolved = await getResolvedStripeEnv();
  const secretKey = resolved.secretKey;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return createStripeClient(secretKey);
}

export { getAppBaseUrl } from "@/lib/app-url";

export function getStripeSecretKey(): string | null {
  return isSecretKeyConfigured() ? resolveStripeSecretKey() : null;
}

export function getStripePublishableKey(): string | null {
  return isPublishableKeyConfigured() ? resolveStripePublishableKey() : null;
}

export async function getResolvedStripeSecretKey(): Promise<string | null> {
  const resolved = await getResolvedStripeEnv();
  return resolved.secretKey;
}

export async function getResolvedStripePublishableKey(): Promise<string | null> {
  const resolved = await getResolvedStripeEnv();
  return resolved.publishableKey;
}

export async function isStripeConfiguredAsync(): Promise<boolean> {
  const resolved = await getResolvedStripeEnv();
  return resolved.secretKey
    ? validateStripeSecretKey(resolved.secretKey).valid
    : false;
}

export async function isStripeClientConfiguredAsync(): Promise<boolean> {
  const resolved = await getResolvedStripeEnv();
  return resolved.publishableKey
    ? validateStripePublishableKey(resolved.publishableKey).valid
    : false;
}

export function isStripeConfigured(): boolean {
  return isSecretKeyConfigured();
}

export function isStripeClientConfigured(): boolean {
  return isPublishableKeyConfigured();
}
