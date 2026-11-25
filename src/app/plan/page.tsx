import type { Metadata } from "next";
import {
  BellRing,
  CircleCheck,
  Compass,
  Flag,
  HeartHandshake,
  PiggyBank,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { requireUser } from "@/lib/auth";
import { readBillingAccess } from "@/lib/billing/entitlements";
import { createInformativePlan, type PlanBucket } from "@/lib/budget";
import { formatMoney, summarizeTransactions } from "@/lib/money";
import { readTransactions } from "@/lib/read-transactions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

import { PlusPlanTools } from "./plus-plan-tools";

export const metadata: Metadata = { title: "Plan mensual" };
export const dynamic = "force-dynamic";

const bucketStyle: Record<PlanBucket["id"], { icon: typeof WalletCards; tone: string; bar: string }> = {
  needs: { icon: HeartHandshake, tone: "bg-cream text-accent", bar: "bg-accent" },
  lifestyle: { icon: Sparkles, tone: "bg-aqua/25 text-brand", bar: "bg-teal" },
  future: { icon: PiggyBank, tone: "bg-orange text-ink", bar: "bg-brand" },
};

type PlanPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const messages = await searchParams;
  const plusData = await readPlusData();
  const { transactions, mode } = await readTransactions();
  const summary = summarizeTransactions(transactions);
  const plan = createInformativePlan(transactions);

  return (
    <div className="min-h-dvh bg-surface pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-ink lg:pb-12">
      <AppHeader title="Plan" />
      <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-gold p-6 text-ink shadow-xl shadow-gold/15 sm:p-9">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-orange/55 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex rounded-full bg-white/50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-ink">Vista informativa · {mode === "live" ? "Datos sincronizados" : "Demostración"}</span>
              <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.04em] sm:text-4xl">Una referencia sencilla para darle intención a tu dinero.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/65">Distribuimos tus ingresos con la guía 50/30/20. No modifica tus movimientos ni establece límites todavía.</p>
            </div>
            <div className="min-w-60 rounded-3xl bg-white/50 p-5">
              <p className="text-sm font-bold text-ink/55">Disponible del periodo</p>
              <p className="mt-2 text-3xl font-extrabold text-ink">{formatMoney(summary.balanceCents)}</p>
              <p className="mt-2 text-sm text-ink/55">Ingresos menos gastos registrados</p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink/65">Referencia mensual</p><h2 className="mt-2 text-2xl font-extrabold">Distribución 50/30/20</h2></div>
            <p className="max-w-md text-sm leading-6 text-slate-500">Los importes se calculan sobre {formatMoney(summary.incomeCents)} de ingresos registrados.</p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {plan.buckets.map((bucket) => <PlanCard key={bucket.id} bucket={bucket} />)}
          </div>
        </section>

        <PlusPlanTools
          hasPlus={plusData.hasPlus}
          plan={plusData.plan}
          mode={mode}
          month={plusData.month}
          budgets={plusData.budgets}
          recurringTransactions={plusData.recurringTransactions}
          spendingByCategory={transactions.reduce<Record<string, number>>((totals, transaction) => {
            if (transaction.type === "expense" && transaction.occurredAt.slice(0, 7) === plusData.month.slice(0, 7)) {
              totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amountCents;
            }
            return totals;
          }, {})}
          notice={messages.success}
          error={messages.error}
        />

        <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-aqua/25 text-brand"><Compass className="size-5" /></span><div><p className="text-sm font-bold text-ink/65">Cómo leer este plan</p><h2 className="text-xl font-extrabold">Una brújula, no una regla</h2></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Guidance icon={CircleCheck} title="Observa" description="Compara lo registrado con la referencia del mes." />
              <Guidance icon={Flag} title="Decide" description="Identifica una categoría que quieras ajustar primero." />
              <Guidance icon={PiggyBank} title="Reserva" description="Considera separar una parte para metas o imprevistos." />
            </div>
            <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">La regla 50/30/20 es una referencia educativa general. Tu distribución adecuada puede cambiar según ingresos, deudas, dependientes y objetivos.</p>
          </article>

          <aside className="rounded-[2rem] bg-cream p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-white text-accent"><BellRing className="size-5" /></span>
            <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.14em] text-ink/65">También en camino</p>
            <h2 className="mt-2 text-2xl font-extrabold">Más herramientas para planear</h2>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
              <li className="flex gap-3"><CircleCheck className="mt-0.5 size-4 shrink-0 text-teal" />Metas de ahorro con fecha</li>
              <li className="flex gap-3"><CircleCheck className="mt-0.5 size-4 shrink-0 text-teal" />Alertas push antes de exceder el plan</li>
              <li className="flex gap-3"><CircleCheck className="mt-0.5 size-4 shrink-0 text-teal" />Planes compartidos para grupos</li>
              <li className="flex gap-3"><CircleCheck className="mt-0.5 size-4 shrink-0 text-teal" />Comparativos entre meses</li>
            </ul>
          </aside>
        </section>
      </main>
      <MobileNavigation active="plan" />
    </div>
  );
}

type Budget = Database["public"]["Tables"]["monthly_budgets"]["Row"];
type RecurringTransaction = Database["public"]["Tables"]["recurring_transactions"]["Row"];

async function readPlusData(): Promise<{
  hasPlus: boolean;
  plan: "free" | "plus" | "family";
  month: string;
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
}> {
  const month = `${new Date().toISOString().slice(0, 7)}-01`;
  if (!isSupabaseConfigured()) {
    return { hasPlus: false, plan: "free", month, budgets: [], recurringTransactions: [] };
  }

  const { supabase, user } = await requireUser();
  const access = await readBillingAccess(supabase, user.id);
  if (!access.hasPlus) {
    return { hasPlus: false, plan: "free", month, budgets: [], recurringTransactions: [] };
  }

  await supabase.rpc("materialize_due_recurring_transactions");
  const [budgetsResult, recurringResult] = await Promise.all([
    supabase.from("monthly_budgets").select("*").eq("month", month).order("category"),
    supabase.from("recurring_transactions").select("*").eq("active", true).order("next_run_on"),
  ]);

  if (budgetsResult.error || recurringResult.error) {
    throw new Error("No se pudieron consultar las herramientas Plus");
  }

  return {
    hasPlus: true,
    plan: access.plan,
    month,
    budgets: budgetsResult.data ?? [],
    recurringTransactions: recurringResult.data ?? [],
  };
}

function PlanCard({ bucket }: { bucket: PlanBucket }) {
  const style = bucketStyle[bucket.id];
  const Icon = style.icon;
  const progress = bucket.targetCents > 0 ? Math.round((bucket.actualCents / bucket.targetCents) * 100) : 0;
  const cappedProgress = Math.min(progress, 100);

  return (
    <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4"><span className={cn("grid size-11 place-items-center rounded-2xl", style.tone)}><Icon className="size-5" /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-extrabold text-slate-500">{bucket.targetPercent}%</span></div>
      <h3 className="mt-5 text-xl font-extrabold">{bucket.label}</h3>
      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{bucket.description}</p>
      <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold text-slate-400">Registrado</p><p className="mt-1 text-xl font-extrabold">{formatMoney(bucket.actualCents)}</p></div><div className="text-right"><p className="text-xs font-bold text-slate-400">Referencia</p><p className="mt-1 text-sm font-extrabold text-slate-600">{formatMoney(bucket.targetCents)}</p></div></div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", style.bar)} style={{ width: `${cappedProgress}%` }} /></div>
      <p className="mt-2 text-right text-xs font-bold text-slate-400">{progress}% de la referencia</p>
    </article>
  );
}

function Guidance({ icon: Icon, title, description }: { icon: typeof CircleCheck; title: string; description: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><Icon className="size-5 text-teal" /><h3 className="mt-3 font-extrabold">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></div>;
}
