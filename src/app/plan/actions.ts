"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { readBillingAccess } from "@/lib/billing/entitlements";

const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  category: z.enum(["food", "home", "transport", "entertainment", "other"]),
  amount: z.coerce.number().positive().max(100_000_000),
});

const recurringSchema = z.object({
  title: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive().max(100_000_000),
  kind: z.enum(["income", "expense"]),
  category: z.enum(["food", "home", "transport", "entertainment", "salary", "other"]),
  frequency: z.enum(["weekly", "monthly"]),
  nextRunOn: z.iso.date(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(30),
}).refine((value) => value.kind === "income" || value.category !== "salary", {
  message: "La categoría Ingresos sólo se usa para entradas",
});

function fail(message: string): never {
  redirect(`/plan?error=${encodeURIComponent(message)}#plus-tools`);
}

async function requirePlus() {
  const context = await requireUser();
  const access = await readBillingAccess(context.supabase, context.user.id);
  if (!access.hasPlus) fail("Esta herramienta necesita el plan Plus");
  return context;
}

export async function saveMonthlyBudget(formData: FormData) {
  const parsed = budgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail("Revisa la categoría y el importe del presupuesto");

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("monthly_budgets").upsert({
    user_id: user.id,
    month: parsed.data.month,
    category: parsed.data.category,
    limit_cents: Math.round(parsed.data.amount * 100),
  }, { onConflict: "user_id,month,category" });

  if (error) fail("No pudimos guardar el presupuesto");
  redirect("/plan?success=budget#plus-tools");
}

export async function deleteMonthlyBudget(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) fail("Presupuesto inválido");

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("monthly_budgets")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) fail("No pudimos eliminar el límite");
  redirect("/plan?success=budget-deleted#plus-tools");
}

export async function createRecurringTransaction(formData: FormData) {
  const parsed = recurringSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail("Revisa los datos del movimiento recurrente");

  const { supabase, user } = await requirePlus();
  const { error } = await supabase.from("recurring_transactions").insert({
    user_id: user.id,
    title: parsed.data.title,
    amount_cents: Math.round(parsed.data.amount * 100),
    kind: parsed.data.kind,
    category: parsed.data.kind === "income" ? "salary" : parsed.data.category,
    frequency: parsed.data.frequency,
    day_of_month: parsed.data.frequency === "monthly" ? Number(parsed.data.nextRunOn.slice(8, 10)) : null,
    next_run_on: parsed.data.nextRunOn,
    reminder_days_before: parsed.data.reminderDaysBefore,
  });

  if (error) fail("No pudimos crear el movimiento recurrente");
  await supabase.rpc("materialize_due_recurring_transactions");
  redirect("/plan?success=recurring#plus-tools");
}

export async function deleteRecurringTransaction(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) fail("Movimiento recurrente inválido");

  const { supabase, user } = await requirePlus();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id);

  if (error) fail("No pudimos eliminar el movimiento recurrente");
  redirect("/plan?success=deleted#plus-tools");
}
