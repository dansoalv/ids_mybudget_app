import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Crown,
  LockKeyhole,
  Repeat2,
  WalletCards,
} from "lucide-react";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { EditModal } from "@/components/edit-modal";
import { formatMoney } from "@/lib/money";
import type { Database } from "@/types/database";

import { createRecurringTransaction, deleteMonthlyBudget, deleteRecurringTransaction, saveMonthlyBudget } from "./actions";

type Budget = Database["public"]["Tables"]["monthly_budgets"]["Row"];
type RecurringTransaction = Database["public"]["Tables"]["recurring_transactions"]["Row"];

type Props = {
  hasPlus: boolean;
  plan: "free" | "plus" | "family";
  mode: "demo" | "live";
  month: string;
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  spendingByCategory: Record<string, number>;
  notice?: string;
  error?: string;
};

const categories = [
  { id: "food", label: "Alimentos" },
  { id: "home", label: "Hogar" },
  { id: "transport", label: "Transporte" },
  { id: "entertainment", label: "Ocio" },
  { id: "other", label: "Otros" },
] as const;

export function PlusPlanTools(props: Props) {
  const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${props.month}T12:00:00Z`));

  return (
    <section id="plus-tools" className="mt-8 grid gap-8">
      {props.hasPlus ? <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-navy p-6 text-white sm:p-8"><div><span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-ink"><Crown className="size-3.5" />{props.plan === "family" ? "Familia" : "Plus"} activo</span><h2 className="mt-3 text-2xl font-extrabold text-white">Automatización habilitada</h2><p className="mt-2 text-sm leading-6 text-white/70">Tus límites son parte de Básico; Plus añade recurrencias, recordatorios y exportación.</p></div><CheckCircle2 className="size-10 text-gold" /></div> : null}

      {props.error ? <p className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-bold text-ink" role="alert">{props.error}</p> : null}
      {props.notice ? <p className="rounded-2xl bg-aqua/35 px-4 py-3 text-sm font-bold text-ink" role="status">{noticeLabel(props.notice)}</p> : null}

      <div className="grid items-start gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-gold text-ink"><WalletCards className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold capitalize text-ink/55">{monthLabel}</p><h3 className="text-xl font-extrabold">Presupuesto por categoría</h3></div><span className="rounded-full bg-aqua/35 px-3 py-1 text-xs font-extrabold text-brand">Incluido</span></div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const budget = props.budgets.find((item) => item.category === category.id);
              const spent = props.spendingByCategory[category.id] ?? 0;
              const percent = budget ? Math.round((spent / budget.limit_cents) * 100) : 0;
              return (
                <div key={category.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3"><p className="font-extrabold">{category.label}</p><span className="text-xs font-bold text-slate-400">{budget ? `${percent}%` : "Sin límite"}</span></div>
                  <p className="mt-2 text-sm text-slate-500">{formatMoney(spent)}{budget ? ` de ${formatMoney(budget.limit_cents)}` : " gastados"}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${percent > 100 ? "bg-accent" : "bg-brand"}`} style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                  {props.mode === "live" ? <div className="mt-4"><EditModal title={budget ? `Editar límite de ${category.label}` : `Definir límite de ${category.label}`} description="Este límite sólo organiza tu presupuesto; no modifica tus movimientos." triggerLabel={budget ? "Editar límite" : "Definir límite"} triggerClassName="w-full bg-white"><form action={saveMonthlyBudget} className="grid gap-3"><input type="hidden" name="month" value={props.month} /><input type="hidden" name="category" value={category.id} /><label className="block"><span className="text-sm font-bold">Límite mensual</span><input name="amount" type="number" inputMode="decimal" min="1" step="0.01" defaultValue={budget ? (budget.limit_cents / 100).toFixed(2) : undefined} required placeholder="0.00" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label><button className="min-h-11 rounded-xl bg-gold px-4 font-extrabold text-ink">Guardar límite</button></form>{budget ? <form action={deleteMonthlyBudget} className="mt-4 border-t border-slate-200 pt-4"><input type="hidden" name="id" value={budget.id} /><ConfirmDeleteButton message={`¿Eliminar el límite de ${category.label}? Tus movimientos no se eliminarán.`} label="Eliminar límite" className="w-full" /></form> : null}</EditModal></div> : null}
                </div>
              );
            })}
          </div>
          {props.mode === "demo" ? <p className="mt-5 rounded-2xl bg-cream p-4 text-sm font-semibold text-ink">Conecta Supabase para guardar límites reales.</p> : null}
        </article>

        {props.hasPlus ? <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-aqua/35 text-brand"><Repeat2 className="size-5" /></span><div><p className="text-sm font-bold text-ink/55">Automatización</p><h3 className="text-xl font-extrabold">Movimiento recurrente</h3></div></div>
          <form action={createRecurringTransaction} className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="text-xs font-extrabold text-ink/60">Concepto</span><input name="title" required minLength={2} placeholder="Ej. Renta" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3" /></label>
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Tipo</span><select name="kind" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label>
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Importe</span><input name="amount" type="number" inputMode="decimal" min="1" step="0.01" required placeholder="0.00" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3" /></label>
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Categoría</span><select name="category" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3">{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Frecuencia</span><select name="frequency" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="monthly">Mensual</option><option value="weekly">Semanal</option></select></label>
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Próxima fecha</span><input name="nextRunOn" type="date" min={today()} defaultValue={today()} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Recordarme antes</span><select name="reminderDaysBefore" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="0">El mismo día</option><option value="1">1 día antes</option><option value="3">3 días antes</option><option value="7">7 días antes</option></select></label>
            <button className="min-h-12 rounded-xl bg-gold px-5 font-extrabold text-ink sm:col-span-2">Crear recurrencia</button>
          </form>
        </article> : <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8"><span className="grid size-12 place-items-center rounded-2xl bg-cream text-accent"><LockKeyhole className="size-6" /></span><p className="mt-5 text-sm font-extrabold uppercase tracking-[0.14em] text-ink/55">Disponible en Plus</p><h3 className="mt-2 text-2xl font-extrabold">Automatiza tus movimientos</h3><p className="mt-3 leading-7 text-slate-500">Programa renta, servicios, nómina y otros movimientos recurrentes con recordatorios.</p><Link href="/profile#subscription" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-extrabold text-ink"><Crown className="size-5" />Conocer Plus</Link></article>}
      </div>

      {props.hasPlus ? <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-orange text-ink"><BellRing className="size-5" /></span><div><p className="text-sm font-bold text-ink/55">Recordatorios en la app</p><h3 className="text-xl font-extrabold">Próximos movimientos</h3></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {props.recurringTransactions.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><CalendarClock className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{item.title}</p><p className="mt-1 text-xs font-semibold text-slate-500">{formatMoney(item.amount_cents)} · {item.frequency === "monthly" ? "Mensual" : "Semanal"} · {relativeDate(item.next_run_on, item.reminder_days_before)}</p></div><form action={deleteRecurringTransaction}><input type="hidden" name="id" value={item.id} /><ConfirmDeleteButton message={`¿Eliminar la recurrencia “${item.title}”?`} label="Eliminar" className="min-h-10 px-3" /></form></div>)}
          {props.recurringTransactions.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500 md:col-span-2">Crea tu primera recurrencia. Cuando llegue la fecha, el movimiento se registrará automáticamente al abrir la app.</p> : null}
        </div>
      </article> : null}
    </section>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function relativeDate(date: string, reminderDays: number) {
  const formatted = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return `${formatted} · aviso ${reminderDays === 0 ? "ese día" : `${reminderDays} día${reminderDays === 1 ? "" : "s"} antes`}`;
}

function noticeLabel(notice: string) {
  if (notice === "budget") return "Presupuesto actualizado";
  if (notice === "budget-deleted") return "Límite de presupuesto eliminado";
  if (notice === "recurring") return "Movimiento recurrente creado";
  if (notice === "deleted") return "Movimiento recurrente eliminado";
  return "Cambios guardados";
}
