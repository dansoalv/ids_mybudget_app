"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { readBillingAccess } from "@/lib/billing/entitlements";

const groupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  kind: z.enum(["household", "trip", "friends", "other"]),
});

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function requirePaidAccess(path: string) {
  const context = await requireUser();
  const access = await readBillingAccess(context.supabase, context.user.id);
  if (!access.hasPlus) fail(path, "Editar o eliminar contenido del grupo requiere Plus o Familiar");
  return context;
}

export async function createGroup(formData: FormData) {
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail("/groups", "Revisa el nombre y el tipo de grupo");

  const { supabase, user } = await requireUser();
  const groupId = randomUUID();
  const { error } = await supabase
    .from("groups")
    .insert({ id: groupId, owner_id: user.id, name: parsed.data.name, kind: parsed.data.kind, currency: "MXN" });

  if (error) {
    console.error("Group creation failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });
    const message = error.message.includes("FREE_GROUP_LIMIT")
      ? "Tu plan Gratis incluye 1 grupo. Consulta los otros planes en tu perfil."
      : "No pudimos crear el grupo. Intenta nuevamente.";
    fail("/groups", message);
  }

  redirect(`/groups/${groupId}`);
}

export async function updateGroup(formData: FormData) {
  const groupId = z.uuid().safeParse(formData.get("groupId"));
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!groupId.success || !parsed.success) fail("/groups", "Revisa los datos del grupo");

  const { supabase } = await requirePaidAccess(`/groups/${groupId.data}`);
  const { data, error } = await supabase
    .from("groups")
    .update({ name: parsed.data.name, kind: parsed.data.kind })
    .eq("id", groupId.data)
    .select("id")
    .maybeSingle();

  if (error || !data) fail(`/groups/${groupId.data}`, "No pudimos actualizar el grupo");
  redirect(`/groups/${groupId.data}?success=group-updated`);
}

export async function deleteGroup(formData: FormData) {
  const groupId = z.uuid().safeParse(formData.get("groupId"));
  if (!groupId.success) fail("/groups", "Grupo inválido");

  const { supabase, user } = await requirePaidAccess(`/groups/${groupId.data}`);
  const { data, error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId.data)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) fail(`/groups/${groupId.data}`, "Sólo el propietario puede eliminar el grupo");
  redirect("/groups?success=group-deleted");
}

export async function createInvitation(formData: FormData) {
  const groupId = z.uuid().safeParse(formData.get("groupId"));
  const email = z.union([z.literal(""), z.email()]).safeParse(formData.get("email") ?? "");
  if (!groupId.success || !email.success) fail("/groups", "Invitación inválida");

  const { supabase, user } = await requireUser();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await supabase.from("group_invitations").insert({
    group_id: groupId.data,
    email: email.data || null,
    token_hash: tokenHash,
    role: "member",
    invited_by: user.id,
  });

  if (error) fail(`/groups/${groupId.data}`, "No pudimos crear la invitación");
  redirect(`/groups/${groupId.data}?invite=${encodeURIComponent(token)}`);
}

const sharedExpenseSchema = z.object({
  groupId: z.uuid(),
  title: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive(),
  category: z.enum(["food", "home", "transport", "entertainment", "other"]),
  paidBy: z.uuid(),
  participantIds: z.array(z.uuid()).min(1).transform((ids) => [...new Set(ids)]),
});

function parseSharedExpense(formData: FormData) {
  return sharedExpenseSchema.safeParse({
    ...Object.fromEntries(formData),
    participantIds: formData.getAll("participantIds"),
  });
}

export async function createSharedExpense(formData: FormData) {
  const parsed = parseSharedExpense(formData);
  const groupId = String(formData.get("groupId") ?? "");
  if (!parsed.success) fail(`/groups/${groupId}`, "Selecciona quiénes participan y revisa los datos del gasto");

  const amountCents = Math.round(parsed.data.amount * 100);
  if (amountCents < parsed.data.participantIds.length) fail(`/groups/${groupId}`, "El importe es demasiado pequeño para dividirlo entre las personas seleccionadas");
  const splits = equalSplits(amountCents, parsed.data.participantIds);

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_shared_expense", {
    p_group_id: parsed.data.groupId,
    p_title: parsed.data.title,
    p_category: parsed.data.category,
    p_amount_cents: amountCents,
    p_paid_by: parsed.data.paidBy,
    p_splits: splits,
    p_client_id: crypto.randomUUID(),
  });

  if (error) fail(`/groups/${parsed.data.groupId}`, "No pudimos guardar el gasto compartido");
  redirect(`/groups/${parsed.data.groupId}?success=expense`);
}

const sharedExpenseUpdateSchema = sharedExpenseSchema.extend({
  transactionId: z.uuid(),
  occurredOn: z.iso.date(),
});

export async function updateSharedExpense(formData: FormData) {
  const parsed = sharedExpenseUpdateSchema.safeParse({
    ...Object.fromEntries(formData),
    participantIds: formData.getAll("participantIds"),
  });
  const groupId = String(formData.get("groupId") ?? "");
  if (!parsed.success) fail(`/groups/${groupId}`, "Selecciona quiénes participan y revisa los datos del gasto");

  const amountCents = Math.round(parsed.data.amount * 100);
  if (amountCents < parsed.data.participantIds.length) fail(`/groups/${groupId}`, "El importe es demasiado pequeño para dividirlo entre las personas seleccionadas");
  const { supabase } = await requirePaidAccess(`/groups/${parsed.data.groupId}`);
  const { data, error } = await supabase.rpc("update_shared_expense", {
    p_transaction_id: parsed.data.transactionId,
    p_group_id: parsed.data.groupId,
    p_title: parsed.data.title,
    p_category: parsed.data.category,
    p_amount_cents: amountCents,
    p_paid_by: parsed.data.paidBy,
    p_splits: equalSplits(amountCents, parsed.data.participantIds),
    p_occurred_at: `${parsed.data.occurredOn}T12:00:00.000Z`,
  });

  if (error || !data) fail(`/groups/${parsed.data.groupId}`, "No pudimos actualizar el gasto compartido");
  redirect(`/groups/${parsed.data.groupId}?success=expense-updated`);
}

export async function deleteSharedExpense(formData: FormData) {
  const parsed = z.object({ groupId: z.uuid(), transactionId: z.uuid() }).safeParse(Object.fromEntries(formData));
  const groupId = String(formData.get("groupId") ?? "");
  if (!parsed.success) fail(`/groups/${groupId}`, "Gasto inválido");

  const { supabase } = await requirePaidAccess(`/groups/${parsed.data.groupId}`);
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsed.data.transactionId)
    .eq("group_id", parsed.data.groupId)
    .select("id")
    .maybeSingle();

  if (error || !data) fail(`/groups/${parsed.data.groupId}`, "No pudimos eliminar el gasto compartido");
  redirect(`/groups/${parsed.data.groupId}?success=expense-deleted`);
}

const settlementSchema = z.object({
  groupId: z.uuid(),
  payerId: z.uuid(),
  payeeId: z.uuid(),
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(300).optional(),
});

export async function createSettlement(formData: FormData) {
  const parsed = settlementSchema.safeParse(Object.fromEntries(formData));
  const groupId = String(formData.get("groupId") ?? "");
  if (!parsed.success || parsed.data.payerId === parsed.data.payeeId) {
    fail(`/groups/${groupId}`, "La liquidación necesita dos integrantes distintos");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("settlements").insert({
    group_id: parsed.data.groupId,
    payer_id: parsed.data.payerId,
    payee_id: parsed.data.payeeId,
    amount_cents: Math.round(parsed.data.amount * 100),
    currency: "MXN",
    note: parsed.data.note || null,
    created_by: user.id,
  });

  if (error) fail(`/groups/${parsed.data.groupId}`, "No pudimos registrar la liquidación");
  redirect(`/groups/${parsed.data.groupId}?success=settlement`);
}

const settlementUpdateSchema = z.object({
  groupId: z.uuid(),
  settlementId: z.uuid(),
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(300).optional(),
  settledOn: z.iso.date(),
});

export async function updateSettlement(formData: FormData) {
  const parsed = settlementUpdateSchema.safeParse(Object.fromEntries(formData));
  const groupId = String(formData.get("groupId") ?? "");
  if (!parsed.success) fail(`/groups/${groupId}`, "Revisa los datos de la liquidación");

  const { supabase } = await requirePaidAccess(`/groups/${parsed.data.groupId}`);
  const { data, error } = await supabase
    .from("settlements")
    .update({
      amount_cents: Math.round(parsed.data.amount * 100),
      note: parsed.data.note || null,
      settled_at: `${parsed.data.settledOn}T12:00:00.000Z`,
    })
    .eq("id", parsed.data.settlementId)
    .eq("group_id", parsed.data.groupId)
    .select("id")
    .maybeSingle();

  if (error || !data) fail(`/groups/${parsed.data.groupId}`, "No pudimos actualizar la liquidación");
  redirect(`/groups/${parsed.data.groupId}?success=settlement-updated`);
}

export async function deleteSettlement(formData: FormData) {
  const parsed = z.object({ groupId: z.uuid(), settlementId: z.uuid() }).safeParse(Object.fromEntries(formData));
  const groupId = String(formData.get("groupId") ?? "");
  if (!parsed.success) fail(`/groups/${groupId}`, "Liquidación inválida");

  const { supabase } = await requirePaidAccess(`/groups/${parsed.data.groupId}`);
  const { data, error } = await supabase
    .from("settlements")
    .delete()
    .eq("id", parsed.data.settlementId)
    .eq("group_id", parsed.data.groupId)
    .select("id")
    .maybeSingle();

  if (error || !data) fail(`/groups/${parsed.data.groupId}`, "No pudimos eliminar la liquidación");
  redirect(`/groups/${parsed.data.groupId}?success=settlement-deleted`);
}

export async function acceptInvitation(formData: FormData) {
  const token = z.string().min(20).safeParse(formData.get("token"));
  if (!token.success) fail("/groups", "El enlace de invitación no es válido");

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("accept_group_invitation", { p_token: token.data });
  if (error || !data) {
    console.error("Invitation acceptance failed", {
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      message: error?.message,
    });
    fail("/groups", "La invitación expiró, ya fue utilizada o pertenece a otro correo");
  }
  redirect(`/groups/${data}?success=joined`);
}

function equalSplits(amountCents: number, memberIds: string[]) {
  const base = Math.floor(amountCents / memberIds.length);
  const remainder = amountCents % memberIds.length;
  return memberIds.map((userId, index) => ({
    user_id: userId,
    amount_cents: base + (index < remainder ? 1 : 0),
  }));
}
