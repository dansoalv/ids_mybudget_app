import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Crown,
  LockKeyhole,
  Repeat2,
  Trash2,
  WalletCards,
} from "lucide-react";

import { formatMoney } from "@/lib/money";
import type { Database } from "@/types/database";

import { createRecurringTransaction, deleteRecurringTransaction, saveMonthlyBudget } from "./actions";

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

  if (!props.hasPlus) {
    return (
      <section id="plus-tools" className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream text-accent"><LockKeyhole className="size-6" /></span>
            <div><p className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink/55">Herramientas Plus</p><h2 className="mt-1 text-2xl font-extrabold">Convierte tu referencia en un plan real</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Configura límites por categoría, automatiza movimientos y recibe recordatorios dentro de la app.</p></div>
          </div>
          <Link href="/profile#subscription" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-extrabold text-ink"><Crown className="size-5" />Ver Plus</Link>
        </div>
      </section>
    );
  }

  return (
    <section id="plus-tools" className="mt-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-navy p-6 text-white sm:p-8">
        <div><span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-ink"><Crown className="size-3.5" />{props.plan === "family" ? "Familia" : "Plus"} activo</span><h2 className="mt-3 text-2xl font-extrabold text-white">Tus herramientas avanzadas ya están habilitadas</h2><p className="mt-2 text-sm leading-6 text-white/70">Presupuestos, automatización y recordatorios protegidos por tu suscripción.</p></div>
        <CheckCircle2 className="size-10 text-gold" />
      </div>

      {props.error ? <p className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-bold text-ink" role="alert">{props.error}</p> : null}
      {props.notice ? <p className="rounded-2xl bg-aqua/35 px-4 py-3 text-sm font-bold text-ink" role="status">{noticeLabel(props.notice)}</p> : null}

      <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-gold text-ink"><WalletCards className="size-5" /></span><div><p className="text-sm font-bold capitalize text-ink/55">{monthLabel}</p><h3 className="text-xl font-extrabold">Presupuesto por categoría</h3></div></div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const budget = props.budgets.find((item) => item.category === category.id);
              const spent = props.spendingByCategory[category.id] ?? 0;
              const percent = budget ? Math.round((spent / budget.limit_cents) * 100) : 0;
              return <div key={category.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="font-extrabold">{category.label}</p><span className="text-xs font-bold text-slate-400">{budget ? `${percent}%` : "Sin límite"}</span></div><p className="mt-2 text-sm text-slate-500">{formatMoney(spent)}{budget ? ` de ${formatMoney(budget.limit_cents)}` : " gastados"}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${percent > 100 ? "bg-accent" : "bg-brand"}`} style={{ width: `${Math.min(percent, 100)}%` }} /></div></div>;
            })}
          </div>

          <form action={saveMonthlyBudget} className="mt-6 grid gap-3 rounded-2xl bg-cream p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="month" value={props.month} />
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Categoría</span><select name="category" className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-white px-3">{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
            <label className="block"><span className="text-xs font-extrabold text-ink/60">Límite mensual</span><input name="amount" type="number" inputMode="decimal" min="1" step="0.01" required placeholder="0.00" className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-white px-3" /></label>
            <button className="min-h-12 rounded-xl bg-accent px-5 font-extrabold text-ink">Guardar</button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
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
        </article>
      </div>

      <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-orange text-ink"><BellRing className="size-5" /></span><div><p className="text-sm font-bold text-ink/55">Recordatorios en la app</p><h3 className="text-xl font-extrabold">Próximos movimientos</h3></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {props.recurringTransactions.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><CalendarClock className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{item.title}</p><p className="mt-1 text-xs font-semibold text-slate-500">{formatMoney(item.amount_cents)} · {item.frequency === "monthly" ? "Mensual" : "Semanal"} · {relativeDate(item.next_run_on, item.reminder_days_before)}</p></div><form action={deleteRecurringTransaction}><input type="hidden" name="id" value={item.id} /><button aria-label={`Eliminar ${item.title}`} className="grid size-10 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-accent"><Trash2 className="size-4" /></button></form></div>)}
          {props.recurringTransactions.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500 md:col-span-2">Crea tu primera recurrencia. Cuando llegue la fecha, el movimiento se registrará automáticamente al abrir la app.</p> : null}
        </div>
      </article>
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
  if (notice === "recurring") return "Movimiento recurrente creado";
  if (notice === "deleted") return "Movimiento recurrente eliminado";
  return "Cambios guardados";
}
