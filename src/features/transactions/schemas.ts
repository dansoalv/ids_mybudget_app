import { z } from "zod";

export const createTransactionSchema = z.object({
  title: z.string().trim().min(2, "Escribe un concepto"),
  amount: z.coerce.number().positive("Ingresa una cantidad mayor a cero"),
  type: z.enum(["income", "expense"]),
  scope: z.enum(["personal", "shared"]),
  category: z.enum([
    "food",
    "home",
    "transport",
    "entertainment",
    "salary",
    "other",
  ]),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const persistedTransactionSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(2).max(120),
  amountCents: z.int().positive(),
  category: z.enum([
    "food",
    "home",
    "transport",
    "entertainment",
    "salary",
    "other",
  ]),
  type: z.enum(["income", "expense"]),
  occurredAt: z.iso.datetime(),
});
