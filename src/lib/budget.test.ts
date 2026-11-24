import { describe, expect, it } from "vitest";

import type { Transaction } from "@/types/finance";

import { createInformativePlan } from "./budget";

const transaction = (
  id: string,
  type: Transaction["type"],
  category: Transaction["category"],
  amountCents: number,
): Transaction => ({
  id,
  title: id,
  type,
  category,
  amountCents,
  currency: "MXN",
  scope: "personal",
  occurredAt: "2026-11-01T00:00:00.000Z",
});

describe("createInformativePlan", () => {
  it("calcula referencias 50/30/20 y clasifica los gastos", () => {
    const plan = createInformativePlan([
      transaction("income", "income", "salary", 100_000),
      transaction("rent", "expense", "home", 40_000),
      transaction("fun", "expense", "entertainment", 10_000),
    ]);

    expect(plan.buckets.map((bucket) => bucket.targetCents)).toEqual([
      50_000,
      30_000,
      20_000,
    ]);
    expect(plan.buckets.map((bucket) => bucket.actualCents)).toEqual([
      40_000,
      10_000,
      50_000,
    ]);
  });
});
