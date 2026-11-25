import { notFound } from "next/navigation";
import { Copy, HandCoins, Pencil, ReceiptText, UserPlus, Users } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { MobileNavigation } from "@/components/mobile-navigation";
import { createInvitation, createSettlement, createSharedExpense, deleteSettlement, deleteSharedExpense, updateSettlement, updateSharedExpense } from "@/app/groups/actions";
import { getAppUrl } from "@/lib/app-url";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string; error?: string; success?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const [groupResult, membersResult, transactionsResult, balancesResult, settlementsResult] = await Promise.all([
    supabase.from("groups").select("id,name,kind,currency,owner_id").eq("id", id).single(),
    supabase.from("group_members").select("user_id,role,joined_at").eq("group_id", id).order("joined_at"),
    supabase.from("transactions").select("id,title,amount_cents,category,occurred_at,paid_by,created_by").eq("group_id", id).order("occurred_at", { ascending: false }).limit(20),
    supabase.from("group_member_balances").select("user_id,balance_cents").eq("group_id", id),
    supabase.from("settlements").select("id,payer_id,payee_id,amount_cents,note,settled_at,created_by").eq("group_id", id).order("settled_at", { ascending: false }).limit(20),
  ]);

  if (groupResult.error || !groupResult.data) notFound();
  const group = groupResult.data;
  const members = membersResult.data ?? [];
  const memberIds = members.map((member) => member.user_id);
  const profilesResult = memberIds.length
    ? await supabase.from("profiles").select("id,display_name").in("id", memberIds)
    : { data: [] };
  const names = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.display_name]));
  const currentRole = members.find((member) => member.user_id === user.id)?.role;
  const canInvite = currentRole === "owner" || currentRole === "admin";
  const invitationUrl = query.invite ? `${getAppUrl()}/invite/${query.invite}` : null;

  return (
    <div className="min-h-dvh bg-surface pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-ink lg:pb-12">
      <AppHeader title={group.name} backHref="/groups" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {(query.error || query.success) ? (
          <div className={`mb-6 rounded-2xl px-5 py-4 text-sm font-bold ${query.error ? "bg-accent/15 text-ink" : "bg-aqua/35 text-ink"}`}>
            {query.error ?? successMessage(query.success)}
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[2rem] bg-gold p-6 text-ink md:col-span-2">
            <p className="text-sm font-bold text-ink/55">Balance del grupo</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(balancesResult.data ?? []).map((balance) => {
                const amount = balance.balance_cents ?? 0;
                return (
                  <div key={balance.user_id} className="rounded-2xl bg-white/8 p-4">
                    <p className="text-sm font-bold">{names.get(balance.user_id ?? "") ?? "Integrante"}</p>
                    <p className="mt-1 text-xl font-extrabold text-ink">{amount >= 0 ? "+" : "−"}{formatMoney(Math.abs(amount))}</p>
                    <p className="mt-1 text-xs text-ink/50">{amount > 0 ? "Debe recibir" : amount < 0 ? "Debe pagar" : "Al corriente"}</p>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <span className="grid size-11 place-items-center rounded-2xl bg-cream text-accent"><Users className="size-5" /></span>
            <h2 className="mt-4 font-extrabold">{members.length} integrantes</h2>
            <div className="mt-4 space-y-3">
              {members.map((member) => <div key={member.user_id} className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-aqua/30 text-xs font-extrabold text-ink">{(names.get(member.user_id) ?? "U").slice(0, 1)}</span><div><p className="text-sm font-bold">{names.get(member.user_id) ?? "Usuario"}</p><p className="text-xs capitalize text-slate-400">{member.role}</p></div></div>)}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ActionCard icon={<ReceiptText className="size-5" />} title="Nuevo gasto compartido" subtitle="Se dividirá por igual entre todos.">
            <form action={createSharedExpense} className="mt-5 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="groupId" value={id} /><input type="hidden" name="memberIds" value={JSON.stringify(memberIds)} />
              <Field label="Concepto" name="title" placeholder="Supermercado" />
              <Field label="Cantidad" name="amount" type="number" placeholder="0.00" />
              <label className="block"><span className="text-sm font-bold">Categoría</span><select name="category" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4"><option value="food">Alimentos</option><option value="home">Hogar</option><option value="transport">Transporte</option><option value="entertainment">Ocio</option><option value="other">Otros</option></select></label>
              <label className="block"><span className="text-sm font-bold">Pagó</span><select name="paidBy" defaultValue={user.id} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4">{members.map((member) => <option key={member.user_id} value={member.user_id}>{names.get(member.user_id)}</option>)}</select></label>
              <button className="min-h-12 rounded-2xl bg-accent px-5 font-extrabold text-ink sm:col-span-2">Guardar gasto</button>
            </form>
          </ActionCard>

          <ActionCard icon={<HandCoins className="size-5" />} title="Registrar liquidación" subtitle="Anota un pago realizado entre integrantes.">
            <form action={createSettlement} className="mt-5 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="groupId" value={id} />
              <MemberSelect label="Pagó" name="payerId" members={members} names={names} currentUserId={user.id} />
              <MemberSelect label="Recibió" name="payeeId" members={members} names={names} />
              <Field label="Cantidad" name="amount" type="number" placeholder="0.00" />
              <Field label="Nota" name="note" placeholder="Transferencia" required={false} />
              <button className="min-h-12 rounded-2xl bg-gold px-5 font-extrabold text-ink sm:col-span-2">Registrar pago</button>
            </form>
          </ActionCard>
        </section>

        {canInvite ? (
          <section className="mt-6 rounded-[2rem] bg-cream p-6">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white text-accent"><UserPlus className="size-5" /></span><div><h2 className="font-extrabold">Invitar integrante</h2><p className="text-sm text-slate-500">Cada enlace sirve para una persona y vence en 7 días.</p></div></div>
            <form action={createInvitation} className="mt-5 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="groupId" value={id} /><input name="email" type="email" placeholder="Correo específico (opcional)" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-white bg-white px-4" /><button className="min-h-12 rounded-2xl bg-accent px-5 font-extrabold text-ink">Crear enlace</button></form>
            {invitationUrl ? <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4"><Copy className="size-5 shrink-0 text-teal" /><p className="min-w-0 flex-1 break-all text-sm font-semibold">{invitationUrl}</p></div> : null}
          </section>
        ) : null}

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Actividad reciente</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {(transactionsResult.data ?? []).map((transaction) => {
              const canManage = transaction.created_by === user.id || currentRole === "owner" || currentRole === "admin";
              return (
                <div key={transaction.id} className="py-4">
                  <div className="flex items-center gap-4"><span className="grid size-10 place-items-center rounded-2xl bg-aqua/20 text-brand"><ReceiptText className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{transaction.title}</p><p className="text-xs text-slate-500">Pagó {names.get(transaction.paid_by ?? "") ?? "Integrante"}</p></div><p className="font-extrabold">{formatMoney(transaction.amount_cents)}</p></div>
                  {canManage ? (
                    <details className="mt-3 rounded-2xl bg-slate-50">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 text-sm font-extrabold"><Pencil className="size-4" />Editar gasto</summary>
                      <div className="border-t border-slate-200 p-4">
                        <form action={updateSharedExpense} className="grid gap-3 sm:grid-cols-2">
                          <input type="hidden" name="groupId" value={id} />
                          <input type="hidden" name="transactionId" value={transaction.id} />
                          <input type="hidden" name="memberIds" value={JSON.stringify(memberIds)} />
                          <label className="block sm:col-span-2"><span className="text-sm font-bold">Concepto</span><input name="title" defaultValue={transaction.title} required minLength={2} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
                          <label className="block"><span className="text-sm font-bold">Importe</span><input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue={(transaction.amount_cents / 100).toFixed(2)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
                          <label className="block"><span className="text-sm font-bold">Categoría</span><select name="category" defaultValue={transaction.category} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="food">Alimentos</option><option value="home">Hogar</option><option value="transport">Transporte</option><option value="entertainment">Ocio</option><option value="other">Otros</option></select></label>
                          <MemberSelect label="Pagó" name="paidBy" members={members} names={names} currentUserId={transaction.paid_by ?? undefined} />
                          <label className="block"><span className="text-sm font-bold">Fecha</span><input name="occurredOn" type="date" defaultValue={transaction.occurred_at.slice(0, 10)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
                          <button className="min-h-12 rounded-xl bg-gold px-4 font-extrabold text-ink sm:col-span-2">Guardar cambios</button>
                        </form>
                        <form action={deleteSharedExpense} className="mt-4 border-t border-slate-200 pt-4">
                          <input type="hidden" name="groupId" value={id} />
                          <input type="hidden" name="transactionId" value={transaction.id} />
                          <ConfirmDeleteButton message={`¿Eliminar “${transaction.title}” del grupo? También se recalcularán los saldos.`} label="Eliminar gasto" className="w-full" />
                        </form>
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            })}
            {(transactionsResult.data ?? []).length === 0 ? <p className="py-8 text-center text-sm font-semibold text-slate-400">Aún no hay gastos en este grupo.</p> : null}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Liquidaciones recientes</h2>
          <p className="mt-1 text-sm text-slate-500">Pagos registrados entre integrantes del grupo.</p>
          <div className="mt-4 divide-y divide-slate-100">
            {(settlementsResult.data ?? []).map((settlement) => {
              const canManage = settlement.created_by === user.id || currentRole === "owner" || currentRole === "admin";
              const payer = names.get(settlement.payer_id) ?? "Integrante";
              const payee = names.get(settlement.payee_id) ?? "Integrante";
              return (
                <div key={settlement.id} className="py-4">
                  <div className="flex items-center gap-4"><span className="grid size-10 place-items-center rounded-2xl bg-cream text-brand"><HandCoins className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{payer} pagó a {payee}</p><p className="truncate text-xs text-slate-500">{settlement.note || "Sin nota"}</p></div><p className="font-extrabold">{formatMoney(settlement.amount_cents)}</p></div>
                  {canManage ? <details className="mt-3 rounded-2xl bg-slate-50"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 text-sm font-extrabold"><Pencil className="size-4" />Editar liquidación</summary><div className="border-t border-slate-200 p-4"><form action={updateSettlement} className="grid gap-3 sm:grid-cols-2"><input type="hidden" name="groupId" value={id} /><input type="hidden" name="settlementId" value={settlement.id} /><label className="block"><span className="text-sm font-bold">Importe</span><input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue={(settlement.amount_cents / 100).toFixed(2)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label><label className="block"><span className="text-sm font-bold">Fecha</span><input name="settledOn" type="date" defaultValue={settlement.settled_at.slice(0, 10)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label><label className="block sm:col-span-2"><span className="text-sm font-bold">Nota</span><input name="note" defaultValue={settlement.note ?? ""} maxLength={300} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label><button className="min-h-12 rounded-xl bg-gold px-4 font-extrabold text-ink sm:col-span-2">Guardar cambios</button></form><form action={deleteSettlement} className="mt-4 border-t border-slate-200 pt-4"><input type="hidden" name="groupId" value={id} /><input type="hidden" name="settlementId" value={settlement.id} /><ConfirmDeleteButton message={`¿Eliminar la liquidación de ${payer} a ${payee}? Los balances se recalcularán.`} label="Eliminar liquidación" className="w-full" /></form></div></details> : null}
                </div>
              );
            })}
            {(settlementsResult.data ?? []).length === 0 ? <p className="py-8 text-center text-sm font-semibold text-slate-400">Aún no hay liquidaciones en este grupo.</p> : null}
          </div>
        </section>
      </main>
      <MobileNavigation active="groups" />
    </div>
  );
}

function successMessage(value?: string) {
  if (value === "expense") return "Gasto compartido registrado.";
  if (value === "expense-updated") return "Gasto compartido actualizado.";
  if (value === "expense-deleted") return "Gasto compartido eliminado y saldos recalculados.";
  if (value === "settlement") return "Liquidación registrada.";
  if (value === "settlement-updated") return "Liquidación actualizada y balances recalculados.";
  if (value === "settlement-deleted") return "Liquidación eliminada y balances recalculados.";
  if (value === "joined") return "Te uniste al grupo.";
  return "Cambios guardados.";
}

function ActionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return <article className="rounded-[2rem] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-aqua/25 text-brand">{icon}</span><div><h2 className="font-extrabold">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div></div>{children}</article>;
}

function Field({ label, name, type = "text", placeholder, required = true }: { label: string; name: string; type?: string; placeholder: string; required?: boolean }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><input name={name} type={type} required={required} min={type === "number" ? "0.01" : undefined} step={type === "number" ? "0.01" : undefined} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-teal" /></label>;
}

function MemberSelect({ label, name, members, names, currentUserId }: { label: string; name: string; members: { user_id: string }[]; names: Map<string, string>; currentUserId?: string }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><select name={name} defaultValue={currentUserId} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4">{members.map((member) => <option key={member.user_id} value={member.user_id}>{names.get(member.user_id)}</option>)}</select></label>;
}
