import "server-only";

import { initialTransactions } from "@/features/dashboard/demo-data";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toTransaction } from "@/lib/transactions";
import type { Transaction } from "@/types/finance";

export type TransactionData = {
  transactions: Transaction[];
  mode: "demo" | "live";
};

export async function readTransactions(): Promise<TransactionData> {
  if (!isSupabaseConfigured()) {
    return { transactions: initialTransactions, mode: "demo" };
  }

  const { supabase } = await requireUser();
  await supabase.rpc("materialize_due_recurring_transactions");
  const [transactionResult, groupResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabase.from("groups").select("id,name"),
  ]);

  if (transactionResult.error) {
    throw new Error("No se pudieron consultar los movimientos");
  }

  const groupNames = new Map(
    (groupResult.data ?? []).map((group) => [group.id, group.name]),
  );
  const transactions = (transactionResult.data ?? []).map((row) =>
    toTransaction(
      row,
      row.group_id ? groupNames.get(row.group_id) : undefined,
    ),
  );

  return { transactions, mode: "live" };
}
