import { summarizeTransactions } from "@/lib/money";
import type { Transaction } from "@/types/finance";

export type PlanBucket = {
  id: "needs" | "lifestyle" | "future";
  label: string;
  description: string;
  targetPercent: number;
  targetCents: number;
  actualCents: number;
};

export function createInformativePlan(
  transactions: readonly Transaction[],
): { buckets: PlanBucket[]; availableCents: number } {
  const summary = summarizeTransactions(transactions);
  const expenseByCategory = transactions.reduce<Record<string, number>>(
    (totals, transaction) => {
      if (transaction.type === "expense") {
        totals[transaction.category] =
          (totals[transaction.category] ?? 0) + transaction.amountCents;
      }
      return totals;
    },
    {},
  );

  const needsCents = ["home", "food", "transport"].reduce(
    (total, category) => total + (expenseByCategory[category] ?? 0),
    0,
  );
  const lifestyleCents = ["entertainment", "other"].reduce(
    (total, category) => total + (expenseByCategory[category] ?? 0),
    0,
  );
  const availableCents = Math.max(summary.balanceCents, 0);

  return {
    availableCents,
    buckets: [
      {
        id: "needs",
        label: "Necesidades",
        description: "Vivienda, alimentos y transporte",
        targetPercent: 50,
        targetCents: Math.round(summary.incomeCents * 0.5),
        actualCents: needsCents,
      },
      {
        id: "lifestyle",
        label: "Estilo de vida",
        description: "Ocio, gustos y gastos flexibles",
        targetPercent: 30,
        targetCents: Math.round(summary.incomeCents * 0.3),
        actualCents: lifestyleCents,
      },
      {
        id: "future",
        label: "Futuro",
        description: "Ahorro, metas y pago de deudas",
        targetPercent: 20,
        targetCents: Math.round(summary.incomeCents * 0.2),
        actualCents: availableCents,
      },
    ],
  };
}
