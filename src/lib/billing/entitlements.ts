import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { hasPaidSubscriptionAccess, type BillingPlanId } from "@/lib/billing/plans";
import type { Database } from "@/types/database";

export type BillingAccess = {
  plan: BillingPlanId;
  hasPlus: boolean;
  status: Database["public"]["Enums"]["subscription_status"] | null;
};

export async function readBillingAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<BillingAccess> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan,status,grace_period_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error("No se pudo consultar la suscripción");

  const hasPlus = hasPaidSubscriptionAccess(data ? {
    plan: data.plan,
    status: data.status,
    gracePeriodEndsAt: data.grace_period_ends_at,
  } : null);

  return {
    plan: hasPlus ? data?.plan ?? "free" : "free",
    hasPlus,
    status: data?.status ?? null,
  };
}
