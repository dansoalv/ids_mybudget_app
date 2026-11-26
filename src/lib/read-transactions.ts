import "server-only";

import { personalTransactions } from "@/features/dashboard/demo-data";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toTransaction } from "@/lib/transactions";
import type { Transaction } from "@/types/finance";

export type PersonalTransactionData = {
  transactions: Transaction[];
  mode: "demo" | "live";
};

export async function readPersonalTransactions(): Promise<PersonalTransactionData> {
  if (!isSupabaseConfigured()) {
    return { transactions: personalTransactions, mode: "demo" };
  }

  const { supabase, user } = await requireUser();
  await supabase.rpc("materialize_due_recurring_transactions");
  const transactionResult = await supabase
    .from("transactions")
    .select("*")
    .eq("owner_id", user.id)
    .is("group_id", null)
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (transactionResult.error) {
    throw new Error("No se pudieron consultar los movimientos");
  }

  const transactions = (transactionResult.data ?? []).map((row) =>
    toTransaction(row),
  );

  return { transactions, mode: "live" };
}
