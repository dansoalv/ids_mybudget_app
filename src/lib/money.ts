import type { CurrencyCode, MonthlySummary, Transaction } from "@/types/finance";

export function formatMoney(
  amountCents: number,
  currency: CurrencyCode = "MXN",
): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function summarizeTransactions(
  transactions: readonly Transaction[],
): MonthlySummary {
  const summary = transactions.reduce(
    (result, transaction) => {
      if (transaction.type === "income") {
        result.incomeCents += transaction.amountCents;
      } else {
        result.expenseCents += transaction.amountCents;
      }

      return result;
    },
    { incomeCents: 0, expenseCents: 0 },
  );

  return {
    ...summary,
    balanceCents: summary.incomeCents - summary.expenseCents,
  };
}
