import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { billingIntervals, paidPlanIds, type BillingInterval, type PaidPlanId } from "@/lib/billing/plans";
import { getPlanFromStripePrice, getStripe, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: processedEvent } = await admin
    .from("stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (processedEvent) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const subscription = typeof session.subscription === "string"
        ? await getStripe().subscriptions.retrieve(session.subscription)
        : session.subscription;
      if (subscription && subscription.object === "subscription") {
        await synchronizeSubscription(subscription);
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused" ||
      event.type === "customer.subscription.resumed"
    ) {
      await synchronizeSubscription(event.data.object);
    }

    const { error } = await admin.from("stripe_events").insert({
      event_id: event.id,
      event_type: event.type,
      livemode: event.livemode,
      api_version: event.api_version,
      event_created_at: new Date(event.created * 1000).toISOString(),
    });
    if (error && error.code !== "23505") throw error;
  } catch (error) {
    console.error("Stripe webhook processing failed", event.id, error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function synchronizeSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const item = subscription.items.data[0];
  if (!item) throw new Error(`Stripe subscription ${subscription.id} has no items`);

  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  let userId = subscription.metadata.supabase_user_id;

  if (!userId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = data?.user_id ?? "";
  }

  if (!userId) throw new Error(`No Supabase user for Stripe subscription ${subscription.id}`);

  const priceSelection = getPlanFromStripePrice(item.price.id);
  const metadataPlan = paidPlanIds.find((plan) => plan === subscription.metadata.plan);
  const metadataInterval = billingIntervals.find((interval) => interval === subscription.metadata.interval);
  const plan: PaidPlanId | undefined = priceSelection?.plan ?? metadataPlan;
  const interval: BillingInterval | undefined = priceSelection?.interval ?? metadataInterval;

  if (!plan || !interval) {
    throw new Error(`Unknown Stripe Price ${item.price.id}`);
  }

  const { data: existing } = await admin
    .from("subscriptions")
    .select("trial_used_at,grace_period_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  const status = mapSubscriptionStatus(subscription.status);
  const gracePeriodEndsAt = status === "past_due"
    ? existing?.grace_period_ends_at ?? new Date(Date.now() + 7 * 86_400_000).toISOString()
    : null;
  const trialUsedAt = existing?.trial_used_at ?? (
    subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null
  );

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: item.price.id,
      billing_interval: interval,
      current_period_starts_at: new Date(item.current_period_start * 1000).toISOString(),
      current_period_ends_at: new Date(item.current_period_end * 1000).toISOString(),
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      trial_used_at: trialUsedAt,
      grace_period_ends_at: gracePeriodEndsAt,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "incomplete":
      return "incomplete";
    case "unpaid":
      return "unpaid";
    case "paused":
      return "paused";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}
