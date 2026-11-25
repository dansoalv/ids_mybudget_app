import { describe, expect, it } from "vitest";

import { billingPlans, founderPromotion, getPlanPriceCents, hasPaidSubscriptionAccess } from "./plans";

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

describe("hasPaidSubscriptionAccess", () => {
  const now = new Date("2026-11-24T12:00:00.000Z");

  it("habilita una prueba Plus", () => {
    expect(hasPaidSubscriptionAccess({ plan: "plus", status: "trialing" }, now)).toBe(true);
  });

  it("mantiene acceso durante la gracia de pago", () => {
    expect(hasPaidSubscriptionAccess({
      plan: "plus",
      status: "past_due",
      gracePeriodEndsAt: "2026-11-25T12:00:00.000Z",
    }, now)).toBe(true);
  });

  it("bloquea Gratis y pagos vencidos fuera de gracia", () => {
    expect(hasPaidSubscriptionAccess({ plan: "free", status: "active" }, now)).toBe(false);
    expect(hasPaidSubscriptionAccess({
      plan: "plus",
      status: "past_due",
      gracePeriodEndsAt: "2026-11-23T12:00:00.000Z",
    }, now)).toBe(false);
  });
});
