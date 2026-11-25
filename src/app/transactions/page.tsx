import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Crown,
  Download,
  Home,
  ReceiptText,
  Sparkles,
  Utensils,
} from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { EditModal } from "@/components/edit-modal";
import { MobileNavigation } from "@/components/mobile-navigation";
import { requireUser } from "@/lib/auth";
import { readBillingAccess } from "@/lib/billing/entitlements";
import { formatMoney, summarizeTransactions } from "@/lib/money";
import { readTransactions } from "@/lib/read-transactions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionCategory } from "@/types/finance";

import { deletePersonalTransaction, updatePersonalTransaction } from "./actions";

export const metadata: Metadata = { title: "Movimientos" };
export const dynamic = "force-dynamic";

const categoryMeta: Record<
  TransactionCategory,
  { label: string; icon: typeof Utensils; tone: string; bar: string }
> = {
  food: { label: "Alimentos", icon: Utensils, tone: "bg-accent/12 text-accent", bar: "bg-accent" },
  home: { label: "Hogar", icon: Home, tone: "bg-cream text-brand", bar: "bg-brand" },
  transport: { label: "Transporte", icon: ArrowUpRight, tone: "bg-aqua/30 text-teal", bar: "bg-teal" },
  entertainment: { label: "Ocio", icon: Sparkles, tone: "bg-accent/12 text-accent", bar: "bg-aqua" },
  salary: { label: "Ingresos", icon: CircleDollarSign, tone: "bg-aqua/30 text-brand", bar: "bg-brand" },
  other: { label: "Otros", icon: ReceiptText, tone: "bg-ink/8 text-ink", bar: "bg-slate-400" },
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const messages = await searchParams;
  const { transactions, mode } = await readTransactions();
  const hasPlus = await readHasPlusAccess();
  const summary = summarizeTransactions(transactions);
  const grouped = groupTransactionsByMonth(transactions);
  const categoryTotals = Object.entries(
    transactions.reduce<Partial<Record<TransactionCategory, number>>>((totals, transaction) => {
      if (transaction.type === "expense") {
        totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amountCents;
      }
      return totals;
    }, {}),
  )
    .map(([category, amountCents]) => ({ category: category as TransactionCategory, amountCents: amountCents ?? 0 }))
    .sort((a, b) => b.amountCents - a.amountCents);

  return (
    <div className="min-h-dvh bg-surface pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-ink lg:pb-12">
      <AppHeader title="Movimientos" />
      <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-10">
        {messages.error || messages.success ? (
          <p className={`mb-6 rounded-2xl px-5 py-4 text-sm font-bold ${messages.error ? "bg-accent/15" : "bg-aqua/35"}`} role={messages.error ? "alert" : "status"}>
            {messages.error ?? (messages.success === "deleted" ? "Movimiento eliminado." : "Movimiento actualizado.")}
          </p>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink/65">Historial financiero</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Todo tu mes, en orden</h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500">Consulta ingresos y gastos. Puedes corregir o eliminar tus movimientos personales cuando lo necesites.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cream px-4 py-2 text-sm font-extrabold text-ink">{mode === "live" ? "Edición habilitada" : "Demostración"}</span>
            {hasPlus ? <a href="/api/transactions/export" download className="flex min-h-10 items-center gap-2 rounded-full bg-navy px-4 text-sm font-extrabold text-white"><Download className="size-4" />Exportar CSV</a> : <Link href="/profile#subscription" className="flex min-h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-extrabold text-ink"><Crown className="size-4" />Exportar con Plus</Link>}
          </div>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-3" aria-label="Totales de movimientos">
          <Metric label="Ingresos" amount={summary.incomeCents} icon={ArrowDownLeft} tone="positive" />
          <Metric label="Gastos" amount={summary.expenseCents} icon={ArrowUpRight} tone="negative" />
          <Metric label="Balance" amount={summary.balanceCents} icon={CircleDollarSign} tone="balance" />
        </section>

        <section className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="text-xl font-extrabold">Historial</h2><p className="mt-1 text-sm text-slate-500">{transactions.length} movimientos registrados</p></div>
              <span className="grid size-11 place-items-center rounded-2xl bg-aqua/25 text-brand"><ReceiptText className="size-5" /></span>
            </div>

            {grouped.map((group) => (
              <div key={group.label} className="mt-7 first:mt-6">
                <h3 className="text-sm font-extrabold capitalize text-slate-400">{group.label}</h3>
                <div className="mt-2 divide-y divide-slate-100">
                  {group.transactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} editable={mode === "live" && transaction.scope === "personal"} />)}
                </div>
              </div>
            ))}
            {transactions.length === 0 ? <div className="py-16 text-center"><ReceiptText className="mx-auto size-8 text-slate-300" /><p className="mt-4 font-bold text-slate-500">Aún no hay movimientos</p><p className="mt-1 text-sm text-slate-400">Los movimientos nuevos aparecerán aquí.</p></div> : null}
          </article>

          <aside className="rounded-[2rem] bg-orange p-6 text-ink lg:sticky lg:top-6">
            <p className="text-sm font-semibold text-ink/55">Distribución de gastos</p>
            <h2 className="mt-1 text-xl font-extrabold">Por categoría</h2>
            <div className="mt-6 space-y-5">
              {categoryTotals.map((item) => {
                const meta = categoryMeta[item.category];
                const percent = summary.expenseCents > 0 ? Math.round((item.amountCents / summary.expenseCents) * 100) : 0;
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold">{meta.label}</span><span className="text-ink/65">{formatMoney(item.amountCents)}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className={cn("h-full rounded-full", meta.bar)} style={{ width: `${percent}%` }} /></div>
                    <p className="mt-1 text-right text-xs font-bold text-ink/50">{percent}%</p>
                  </div>
                );
              })}
              {categoryTotals.length === 0 ? <p className="text-sm leading-6 text-ink/60">Registra gastos para ver su distribución.</p> : null}
            </div>
          </aside>
        </section>
      </main>
      <MobileNavigation active="transactions" />
    </div>
  );
}

async function readHasPlusAccess() {
  if (!isSupabaseConfigured()) return false;
  const { supabase, user } = await requireUser();
  return (await readBillingAccess(supabase, user.id)).hasPlus;
}

function Metric({ label, amount, icon: Icon, tone }: { label: string; amount: number; icon: typeof ArrowDownLeft; tone: "positive" | "negative" | "balance" }) {
  return <article className={cn("rounded-[1.75rem] p-5", tone === "balance" ? "bg-gold text-ink" : "border border-slate-200/70 bg-white")}><span className={cn("grid size-10 place-items-center rounded-2xl", tone === "positive" ? "bg-aqua/25 text-brand" : tone === "negative" ? "bg-cream text-accent" : "bg-white/50 text-ink")}><Icon className="size-5" /></span><p className={cn("mt-4 text-sm font-bold", tone === "balance" ? "text-ink/60" : "text-slate-500")}>{label}</p><p className="mt-1 text-2xl font-extrabold tracking-tight">{formatMoney(amount)}</p></article>;
}

function TransactionItem({ transaction, editable }: { transaction: Transaction; editable: boolean }) {
  const meta = categoryMeta[transaction.category];
  const Icon = meta.icon;
  const date = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(transaction.occurredAt));
  return (
    <div className="py-4">
      <div className="flex items-center gap-3 sm:gap-4"><span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", meta.tone)}><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-bold">{transaction.title}</p>{transaction.scope === "shared" ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500">Compartido</span> : null}</div><p className="mt-0.5 truncate text-sm text-slate-500">{meta.label} · {transaction.groupName ?? date}</p></div><p className="whitespace-nowrap font-extrabold text-ink">{transaction.type === "income" ? "+" : "−"}{formatMoney(transaction.amountCents)}</p></div>
      {editable ? (
        <div className="mt-3">
          <EditModal title="Editar movimiento" description="Actualiza los datos o elimina este movimiento personal." triggerLabel="Editar movimiento" triggerClassName="w-full">
            <form action={updatePersonalTransaction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={transaction.id} />
              <label className="block sm:col-span-2"><span className="text-sm font-bold">Concepto</span><input name="title" defaultValue={transaction.title} required minLength={2} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
              <label className="block"><span className="text-sm font-bold">Tipo</span><select name="kind" defaultValue={transaction.type} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label>
              <label className="block"><span className="text-sm font-bold">Importe</span><input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue={(transaction.amountCents / 100).toFixed(2)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
              <label className="block"><span className="text-sm font-bold">Categoría</span><select name="category" defaultValue={transaction.category} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3">{Object.entries(categoryMeta).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
              <label className="block"><span className="text-sm font-bold">Fecha</span><input name="occurredOn" type="date" defaultValue={transaction.occurredAt.slice(0, 10)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3" /></label>
              <button className="min-h-12 rounded-xl bg-gold px-4 font-extrabold text-ink sm:col-span-2">Guardar cambios</button>
            </form>
            <form action={deletePersonalTransaction} className="mt-4 border-t border-slate-200 pt-4">
              <input type="hidden" name="id" value={transaction.id} />
              <ConfirmDeleteButton message={`¿Eliminar “${transaction.title}”? Esta acción no se puede deshacer.`} label="Eliminar movimiento" className="w-full" />
            </form>
          </EditModal>
        </div>
      ) : null}
    </div>
  );
}

function groupTransactionsByMonth(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const label = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(new Date(transaction.occurredAt));
    groups.set(label, [...(groups.get(label) ?? []), transaction]);
  }
  return Array.from(groups, ([label, items]) => ({ label, transactions: items }));
}
