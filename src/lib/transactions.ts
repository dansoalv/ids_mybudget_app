import type { Database } from "@/types/database";
import type { Transaction, TransactionCategory } from "@/types/finance";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

const categories = new Set<TransactionCategory>([
  "food",
  "home",
  "transport",
  "entertainment",
  "salary",
  "other",
]);

export function toTransaction(row: TransactionRow, groupName?: string): Transaction {
  return {
    id: row.id,
    title: row.title,
    amountCents: row.amount_cents,
    currency: "MXN",
    type: row.kind,
    scope: row.group_id ? "shared" : "personal",
    category: categories.has(row.category as TransactionCategory)
      ? (row.category as TransactionCategory)
      : "other",
    occurredAt: row.occurred_at,
    groupName,
  };
}
