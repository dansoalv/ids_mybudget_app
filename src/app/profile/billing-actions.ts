"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { billingIntervals, paidPlanIds } from "@/lib/billing/plans";
import {
  getAppUrl,
  getStripe,
  getStripePriceId,
  isStripeCheckoutConfigured,
} from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const checkoutSchema = z.object({
  plan: z.enum(paidPlanIds),
  interval: z.enum(billingIntervals),
});

const manageableStatuses = new Set(["active", "trialing", "past_due"]);

export async function createCheckoutSession(formData: FormData) {
  const selection = checkoutSchema.safeParse({
    plan: formData.get("plan"),
    interval: formData.get("interval"),
  });

  if (!selection.success) redirect("/profile?billing=invalid#subscription");
  if (!isStripeCheckoutConfigured()) redirect("/profile?billing=configuration#subscription");

  const { supabase, user } = await requireUser();
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan,status,stripe_customer_id,trial_used_at")
    .eq("user_id", user.id)
    .single();

  if (subscriptionError) redirect("/profile?billing=error#subscription");

  if (subscription.plan !== "free" && manageableStatuses.has(subscription.status)) {
    const portalUrl = await createPortalUrl(subscription.stripe_customer_id);
    redirect(portalUrl ?? "/profile?billing=portal#subscription");
  }

  let checkoutUrl: string | null = null;

  try {
    const stripe = getStripe();
    const admin = createAdminClient();
    let customerId = subscription.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      const { error } = await admin
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
      if (error) throw error;
    }

    const metadata = {
      supabase_user_id: user.id,
      plan: selection.data.plan,
      interval: selection.data.interval,
    };
    const trial = subscription.trial_used_at
      ? {}
      : {
          trial_period_days: 14,
          trial_settings: { end_behavior: { missing_payment_method: "cancel" as const } },
        };

    const openSessions = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 10,
    });
    const reusableSession = openSessions.data.find((session) =>
      session.mode === "subscription" &&
      session.metadata?.supabase_user_id === user.id &&
      session.metadata?.plan === selection.data.plan &&
      session.metadata?.interval === selection.data.interval &&
      session.url
    );

    if (reusableSession?.url) {
      checkoutUrl = reusableSession.url;
    } else {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        locale: "es",
        line_items: [
          {
            price: getStripePriceId(selection.data.plan, selection.data.interval),
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        payment_method_collection: "if_required",
        metadata,
        subscription_data: { metadata, ...trial },
        success_url: `${getAppUrl()}/profile?billing=success#subscription`,
        cancel_url: `${getAppUrl()}/profile?billing=canceled#subscription`,
      });

      checkoutUrl = session.url;
    }
  } catch (error) {
    console.error("Unable to create Stripe Checkout Session", error);
  }

  redirect(checkoutUrl ?? "/profile?billing=error#subscription");
}

export async function createCustomerPortalSession() {
  if (!isStripeCheckoutConfigured()) redirect("/profile?billing=configuration#subscription");

  const { supabase, user } = await requireUser();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const portalUrl = await createPortalUrl(subscription?.stripe_customer_id ?? null);
  redirect(portalUrl ?? "/profile?billing=portal#subscription");
}

async function createPortalUrl(customerId: string | null) {
  if (!customerId) return null;

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/profile#subscription`,
    });
    return session.url;
  } catch (error) {
    console.error("Unable to create Stripe Customer Portal Session", error);
    return null;
  }
}
