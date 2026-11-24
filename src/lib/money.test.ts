import { describe, expect, it } from "vitest";

import type { Transaction } from "@/types/finance";

import { formatMoney, summarizeTransactions } from "./money";

const transactions: Transaction[] = [
  {
    id: "income",
    title: "Ingreso",
    amountCents: 100000,
    currency: "MXN",
    type: "income",
    scope: "personal",
    category: "salary",
    occurredAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "expense",
    title: "Gasto",
    amountCents: 2550,
    currency: "MXN",
    type: "expense",
    scope: "personal",
    category: "food",
    occurredAt: "2026-11-02T00:00:00.000Z",
  },
];

describe("money", () => {
  it("formatea centavos en pesos mexicanos", () => {
    expect(formatMoney(123456)).toMatch(/1,234\.56/);
  });

  it("calcula ingresos, gastos y balance sin usar decimales", () => {
    expect(summarizeTransactions(transactions)).toEqual({
      incomeCents: 100000,
      expenseCents: 2550,
      balanceCents: 97450,
    });
  });
});
