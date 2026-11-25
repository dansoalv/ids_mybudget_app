import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { requireUser } from "@/lib/auth";
import { isStripeCheckoutConfigured } from "@/lib/billing/stripe";
import { hasPaidSubscriptionAccess } from "@/lib/billing/plans";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { ProfileContent, type ProfileData } from "./profile-content";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const profile = await readProfile();
  const { billing } = await searchParams;

  return (
    <div className="min-h-dvh bg-surface pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-ink lg:pb-12">
      <AppHeader title="Perfil" />
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:py-9">
        <ProfileContent profile={profile} billingNotice={billing} />
      </main>
      <MobileNavigation active="profile" />
    </div>
  );
}

async function readProfile(): Promise<ProfileData> {
  if (!isSupabaseConfigured()) {
    return {
      displayName: "Daniel Sánchez",
      email: "daniel@ejemplo.com",
      currency: "MXN",
      locale: "es-MX",
      timezone: "America/Mexico_City",
      createdAt: "2026-11-01T12:00:00.000Z",
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      billingInterval: null,
      currentPeriodEndsAt: null,
      trialEndsAt: null,
      gracePeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      hasBillingCustomer: false,
      billingEnabled: false,
      ownedGroupCount: 1,
      mode: "demo",
    };
  }

  const { supabase, user } = await requireUser();
  const [profileResult, subscriptionResult, groupsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,default_currency,locale,timezone,created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("plan,status,billing_interval,current_period_ends_at,trial_ends_at,grace_period_ends_at,cancel_at_period_end,stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("groups").select("id", { count: "exact", head: true }).eq("owner_id", user.id).is("archived_at", null),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error("No se pudo consultar el perfil");
  }

  const subscription = subscriptionResult.data;
  const hasPaidAccess = hasPaidSubscriptionAccess(subscription ? {
    plan: subscription.plan,
    status: subscription.status,
    gracePeriodEndsAt: subscription.grace_period_ends_at,
  } : null);
  const subscriptionPlan = hasPaidAccess ? subscription?.plan ?? "free" : "free";

  return {
    displayName: profileResult.data.display_name,
    email: user.email ?? "Correo no disponible",
    currency: profileResult.data.default_currency,
    locale: profileResult.data.locale,
    timezone: profileResult.data.timezone,
    createdAt: profileResult.data.created_at,
    subscriptionPlan,
    subscriptionStatus: subscription?.status ?? "active",
    billingInterval: subscription?.billing_interval ?? null,
    currentPeriodEndsAt: subscription?.current_period_ends_at ?? null,
    trialEndsAt: subscription?.trial_ends_at ?? null,
    gracePeriodEndsAt: subscription?.grace_period_ends_at ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    hasBillingCustomer: Boolean(subscription?.stripe_customer_id),
    billingEnabled: isStripeCheckoutConfigured(),
    ownedGroupCount: groupsResult.count ?? 0,
    mode: "live",
  };
}
