import Stripe from "stripe";

export { getAppUrl } from "@/lib/app-url";

import type { BillingInterval, PaidPlanId } from "@/lib/billing/plans";

let stripeClient: Stripe | undefined;

const priceEnvironmentKeys: Record<PaidPlanId, Record<BillingInterval, string>> = {
  plus: {
    month: "STRIPE_PLUS_MONTHLY_PRICE_ID",
    year: "STRIPE_PLUS_ANNUAL_PRICE_ID",
  },
  family: {
    month: "STRIPE_FAMILY_MONTHLY_PRICE_ID",
    year: "STRIPE_FAMILY_ANNUAL_PRICE_ID",
  },
};

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getStripePriceId(plan: PaidPlanId, interval: BillingInterval) {
  const environmentKey = priceEnvironmentKeys[plan][interval];
  const priceId = process.env[environmentKey];
  if (!priceId) throw new Error(`${environmentKey} is not configured`);
  return priceId;
}

export function getPlanFromStripePrice(priceId: string): { plan: PaidPlanId; interval: BillingInterval } | null {
  for (const plan of Object.keys(priceEnvironmentKeys) as PaidPlanId[]) {
    for (const interval of Object.keys(priceEnvironmentKeys[plan]) as BillingInterval[]) {
      if (process.env[priceEnvironmentKeys[plan][interval]] === priceId) {
        return { plan, interval };
      }
    }
  }
  return null;
}

export function isStripeCheckoutConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.STRIPE_PLUS_MONTHLY_PRICE_ID &&
      process.env.STRIPE_PLUS_ANNUAL_PRICE_ID &&
      process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID &&
      process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID,
  );
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return secret;
}

