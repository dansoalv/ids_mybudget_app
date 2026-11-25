import { describe, expect, it } from "vitest";

import { billingPlans, founderPromotion, getPlanPriceCents } from "./plans";

describe("billing plans", () => {
  it("mantiene los precios mensuales aprobados", () => {
    expect(getPlanPriceCents("plus", "month")).toBe(5_900);
    expect(getPlanPriceCents("family", "month")).toBe(9_900);
  });

  it("ofrece dos meses sin costo en el pago anual", () => {
    expect(billingPlans.plus.annualCents).toBe(billingPlans.plus.monthlyCents * 10);
    expect(billingPlans.family.annualCents).toBe(billingPlans.family.monthlyCents * 10);
  });

  it("conserva la promoción de fundadores", () => {
    expect(founderPromotion).toMatchObject({
      code: "FUNDADOR20",
      percentOff: 20,
      maxRedemptions: 100,
    });
  });
});
