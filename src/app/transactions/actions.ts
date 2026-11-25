"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";

const personalTransactionSchema = z
  .object({
    id: z.uuid(),
    title: z.string().trim().min(2).max(120),
    amount: z.coerce.number().positive().max(100_000_000),
    kind: z.enum(["income", "expense"]),
    category: z.enum(["food", "home", "transport", "entertainment", "salary", "other"]),
    occurredOn: z.iso.date(),
  })
  .refine((value) => value.kind === "income" || value.category !== "salary", {
    message: "La categoría Ingresos sólo se usa para entradas",
  });

function fail(message: string): never {
  redirect(`/transactions?error=${encodeURIComponent(message)}`);
}

export async function updatePersonalTransaction(formData: FormData) {
  const parsed = personalTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail("Revisa los datos del movimiento");

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .update({
      title: parsed.data.title,
      amount_cents: Math.round(parsed.data.amount * 100),
      kind: parsed.data.kind,
      category: parsed.data.kind === "income" ? "salary" : parsed.data.category,
      occurred_at: `${parsed.data.occurredOn}T12:00:00.000Z`,
    })
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id)
    .is("group_id", null)
    .select("id")
    .maybeSingle();

  if (error || !data) fail("No pudimos actualizar el movimiento");
  redirect("/transactions?success=updated");
}

export async function deletePersonalTransaction(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) fail("Movimiento inválido");

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id.data)
    .eq("owner_id", user.id)
    .is("group_id", null)
    .select("id")
    .maybeSingle();

  if (error || !data) fail("No pudimos eliminar el movimiento");
  redirect("/transactions?success=deleted");
}
