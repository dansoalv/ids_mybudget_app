import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("Define STRIPE_SECRET_KEY con una clave de prueba sk_test_ antes de continuar.");
}

if (!secretKey.startsWith("sk_test_") && process.env.ALLOW_STRIPE_LIVE_SETUP !== "true") {
  throw new Error("Este script solo opera en modo prueba. Define ALLOW_STRIPE_LIVE_SETUP=true para usar una clave real.");
}

const stripe = new Stripe(secretKey);
const definitions = [
  { plan: "plus", name: "MyBudget Plus", interval: "month", unitAmount: 5_900, lookupKey: "mybudget_plus_monthly_mxn" },
  { plan: "plus", name: "MyBudget Plus", interval: "year", unitAmount: 59_000, lookupKey: "mybudget_plus_annual_mxn" },
  { plan: "family", name: "MyBudget Familia", interval: "month", unitAmount: 9_900, lookupKey: "mybudget_family_monthly_mxn" },
  { plan: "family", name: "MyBudget Familia", interval: "year", unitAmount: 99_000, lookupKey: "mybudget_family_annual_mxn" },
];

const productIds = new Map();
const priceIds = new Map();

for (const definition of definitions) {
  let productId = productIds.get(definition.plan);
  if (!productId) {
    const existingProducts = await stripe.products.search({
      query: `active:'true' AND metadata['mybudget_plan']:'${definition.plan}'`,
      limit: 1,
    });
    const product = existingProducts.data[0] ?? await stripe.products.create({
      name: definition.name,
      metadata: { app: "mybudget", mybudget_plan: definition.plan },
    });
    productId = product.id;
    productIds.set(definition.plan, productId);
  }

  const existingPrices = await stripe.prices.list({
    lookup_keys: [definition.lookupKey],
    active: true,
    limit: 1,
  });
  const price = existingPrices.data[0] ?? await stripe.prices.create({
    product: productId,
    currency: "mxn",
    unit_amount: definition.unitAmount,
    recurring: { interval: definition.interval },
    lookup_key: definition.lookupKey,
    metadata: { app: "mybudget", plan: definition.plan },
  });
  priceIds.set(definition.lookupKey, price.id);
}

const couponId = "MYBUDGET_FUNDADOR20";
let coupon;
try {
  coupon = await stripe.coupons.retrieve(couponId);
} catch (error) {
  if (error?.statusCode !== 404) throw error;
  coupon = await stripe.coupons.create({
    id: couponId,
    name: "Fundadores MyBudget · 20%",
    percent_off: 20,
    duration: "repeating",
    duration_in_months: 3,
    max_redemptions: 100,
    metadata: { app: "mybudget" },
  });
}

const promotionCodes = await stripe.promotionCodes.list({ code: "FUNDADOR20", active: true, limit: 1 });
if (!promotionCodes.data[0]) {
  await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: "FUNDADOR20",
    max_redemptions: 100,
    restrictions: { first_time_transaction: true },
    metadata: { app: "mybudget" },
  });
}

const environment = {
  STRIPE_PLUS_MONTHLY_PRICE_ID: priceIds.get("mybudget_plus_monthly_mxn"),
  STRIPE_PLUS_ANNUAL_PRICE_ID: priceIds.get("mybudget_plus_annual_mxn"),
  STRIPE_FAMILY_MONTHLY_PRICE_ID: priceIds.get("mybudget_family_monthly_mxn"),
  STRIPE_FAMILY_ANNUAL_PRICE_ID: priceIds.get("mybudget_family_annual_mxn"),
};

process.stdout.write("Stripe quedó preparado. Copia estas variables en .env.local y Vercel:\n\n");
for (const [key, value] of Object.entries(environment)) {
  process.stdout.write(`${key}=${value}\n`);
}
process.stdout.write("\nCódigo promocional creado: FUNDADOR20\n");

