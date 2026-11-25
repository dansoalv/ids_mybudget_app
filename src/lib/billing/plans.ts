export const billingIntervals = ["month", "year"] as const;
export type BillingInterval = (typeof billingIntervals)[number];

export const paidPlanIds = ["plus", "family"] as const;
export type PaidPlanId = (typeof paidPlanIds)[number];
export type BillingPlanId = "free" | PaidPlanId;

export type SubscriptionAccessInput = {
  plan?: BillingPlanId | null;
  status?: "active" | "trialing" | "past_due" | "incomplete" | "unpaid" | "paused" | "canceled" | null;
  gracePeriodEndsAt?: string | null;
};

export const billingPlans = {
  free: {
    name: "Gratis",
    monthlyCents: 0,
    annualCents: 0,
  },
  plus: {
    name: "Plus",
    monthlyCents: 5_900,
    annualCents: 59_000,
  },
  family: {
    name: "Familia",
    monthlyCents: 9_900,
    annualCents: 99_000,
  },
} as const;

export const founderPromotion = {
  code: "FUNDADOR20",
  percentOff: 20,
  monthlyDuration: "3 meses",
  annualDuration: "el primer pago anual",
  maxRedemptions: 100,
} as const;

export function getPlanPriceCents(plan: BillingPlanId, interval: BillingInterval) {
  const details = billingPlans[plan];
  return interval === "month" ? details.monthlyCents : details.annualCents;
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function hasPaidSubscriptionAccess(
  subscription: SubscriptionAccessInput | null | undefined,
  now = new Date(),
) {
  if (!subscription || subscription.plan === "free") return false;
  if (subscription.status === "active" || subscription.status === "trialing") return true;

  return subscription.status === "past_due" &&
    Boolean(subscription.gracePeriodEndsAt) &&
    new Date(subscription.gracePeriodEndsAt!).getTime() > now.getTime();
}

