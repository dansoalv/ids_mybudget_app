"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Home,
  LogOut,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Sparkles,
  Users,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";

import { formatMoney, summarizeTransactions } from "@/lib/money";
import { queueTransaction } from "@/lib/offline/queue";
import { cn } from "@/lib/utils";
import { createTransactionSchema } from "@/features/transactions/schemas";
import { signOut } from "@/app/login/actions";
import type {
  Transaction,
  TransactionCategory,
  TransactionScope,
  TransactionType,
} from "@/types/finance";

const categoryMeta: Record<
  TransactionCategory,
  { label: string; color: string; icon: typeof Utensils }
> = {
  food: { label: "Alimentos", color: "bg-accent/12 text-accent", icon: Utensils },
  home: { label: "Hogar", color: "bg-cream text-brand", icon: Home },
  transport: { label: "Transporte", color: "bg-aqua/30 text-teal", icon: ArrowUpRight },
  entertainment: { label: "Ocio", color: "bg-accent/12 text-accent", icon: Sparkles },
  salary: { label: "Ingresos", color: "bg-aqua/30 text-brand", icon: CircleDollarSign },
  other: { label: "Otros", color: "bg-ink/8 text-ink", icon: ReceiptText },
};

const navigation = [
  { label: "Inicio", icon: Home, href: "/", active: true },
  { label: "Movimientos", icon: ReceiptText, href: "/" },
  { label: "Grupos", icon: Users, href: "/groups" },
  { label: "Presupuesto", icon: WalletCards, href: "/" },
];

type DashboardProps = {
  initialTransactions: Transaction[];
  initialSharedBalances: import("@/types/finance").SharedBalance[];
  user: { displayName: string; initials: string };
  dataMode: "demo" | "live";
};

export function Dashboard({ initialTransactions, initialSharedBalances, user, dataMode }: DashboardProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const summary = useMemo(
    () => summarizeTransactions(transactions),
    [transactions],
  );

  async function addTransaction(transaction: Transaction) {
    setTransactions((current) => [transaction, ...current]);
    setIsFormOpen(false);

    if (dataMode === "demo") {
      setNotice("Movimiento registrado en la demostración");
      window.setTimeout(() => setNotice(null), 3000);
      return;
    }

    const payload = {
      id: transaction.id,
      title: transaction.title,
      amountCents: transaction.amountCents,
      category: transaction.category,
      type: transaction.type,
      occurredAt: transaction.occurredAt,
    };

    try {
      if (!navigator.onLine) throw new TypeError("offline");
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("server");
      setNotice("Movimiento guardado y sincronizado");
    } catch (error) {
      if (error instanceof TypeError || !navigator.onLine) {
        await queueTransaction(payload);
        setNotice("Guardado sin conexión · se sincronizará después");
      } else {
        setTransactions((current) => current.filter((item) => item.id !== transaction.id));
        setNotice("No pudimos guardar el movimiento. Intenta de nuevo.");
      }
    }

    window.setTimeout(() => setNotice(null), 3000);
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-ink px-6 py-8 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-11 place-items-center rounded-2xl bg-accent text-cream shadow-lg shadow-black/20">
            <WalletCards className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">MyBudget</p>
            <p className="text-sm text-white/55">Dinero en equipo</p>
          </div>
        </div>

        <nav className="mt-12 space-y-2" aria-label="Navegación principal">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold transition",
                  item.active
                    ? "bg-cream text-brand shadow-sm"
                    : "text-white/65 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="size-5" strokeWidth={2.2} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl bg-white/8 p-5">
          <div className="mb-3 grid size-10 place-items-center rounded-2xl bg-aqua/15 text-aqua">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <p className="font-bold">Tu mes, más claro</p>
          <p className="mt-1 text-sm leading-5 text-white/55">
            {transactions.length === 1 ? "Has registrado 1 movimiento." : `Has registrado ${transactions.length} movimientos.`}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl p-2 text-left">
            <span className="grid size-10 place-items-center rounded-full bg-aqua font-bold text-ink">{user.initials}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{user.displayName}</span>
            <span className="block truncate text-xs text-white/50">{dataMode === "live" ? "Cuenta sincronizada" : "Modo demostración"}</span>
          </span>
          {dataMode === "live" ? (
            <form action={signOut}>
              <button type="submit" className="grid size-10 place-items-center rounded-xl text-white/45 hover:bg-white/8 hover:text-white" aria-label="Cerrar sesión">
                <LogOut className="size-5" aria-hidden="true" />
              </button>
            </form>
          ) : <MoreHorizontal className="size-5 text-white/45" aria-hidden="true" />}
        </div>
      </aside>

      <main className="pb-28 lg:ml-72 lg:pb-12">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 lg:px-10 lg:py-9">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">{new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">
                Hola, {user.displayName.split(" ")[0]} <span aria-hidden="true">👋</span>
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="hidden min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex"
            >
              <Plus className="size-5" aria-hidden="true" />
              Nuevo movimiento
            </button>
          </header>

          <section className="mt-7 grid gap-4 lg:grid-cols-[1.35fr_0.8fr_0.8fr]" aria-label="Resumen del mes">
            <article className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-white shadow-xl shadow-brand/20 sm:p-7">
              <div className="absolute -right-10 -top-16 size-44 rounded-full border-[34px] border-aqua/15" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-white/65">Balance disponible</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/75">Noviembre</span>
                </div>
                <p className="mt-4 text-4xl font-extrabold tracking-[-0.045em] sm:text-[2.75rem]">
                  {formatMoney(summary.balanceCents)}
                </p>
                <div className="mt-7 flex gap-7 border-t border-white/10 pt-5">
                  <div>
                    <p className="text-xs font-semibold text-white/50">Ingresos</p>
                    <p className="mt-1 font-bold text-cream">{formatMoney(summary.incomeCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/50">Gastos</p>
                    <p className="mt-1 font-bold">{formatMoney(summary.expenseCents)}</p>
                  </div>
                </div>
              </div>
            </article>

            <SummaryCard
              label="Ingresos"
              amount={summary.incomeCents}
              icon={ArrowDownLeft}
              tone="positive"
              detail="Nómina y depósitos"
            />
            <SummaryCard
              label="Gastos"
              amount={summary.expenseCents}
              icon={ArrowUpRight}
              tone="negative"
              detail="42% del ingreso mensual"
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
            <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Movimientos recientes</h2>
                  <p className="mt-1 text-sm text-slate-500">Tu actividad personal y compartida</p>
                </div>
                <button type="button" className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-teal hover:bg-aqua/15">
                  Ver todos
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {transactions.slice(0, 5).map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </article>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Gasto por categoría</h2>
                    <p className="mt-1 text-sm text-slate-500">Noviembre</p>
                  </div>
                  <button type="button" className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Más opciones">
                    <MoreHorizontal className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-6">
                  <div className="relative size-28 shrink-0 rounded-full bg-[conic-gradient(#0F3D3E_0_54%,#2E6F73_54%_78%,#C6601F_78%_91%,#7FB3B8_91%_100%)]">
                    <div className="absolute inset-4 grid place-items-center rounded-full bg-white text-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Total</p>
                        <p className="text-sm font-extrabold">{formatMoney(summary.expenseCents)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-3 text-sm">
                    <Legend color="bg-brand" label="Hogar" value="54%" />
                    <Legend color="bg-teal" label="Alimentos" value="24%" />
                    <Legend color="bg-accent" label="Transporte" value="13%" />
                    <Legend color="bg-aqua" label="Otros" value="9%" />
                  </div>
                </div>
              </article>

              <article className="rounded-[2rem] bg-cream p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Cuentas compartidas</h2>
                    <p className="mt-1 text-sm text-slate-500">Tus saldos pendientes</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-2xl bg-white/70 text-accent">
                    <Users className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {initialSharedBalances.map((balance) => (
                    <div key={balance.id} className="flex items-center gap-3 rounded-2xl bg-white/85 p-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                        {balance.memberName.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{balance.groupName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {balance.direction === "owed_to_you"
                            ? `${balance.memberName} te debe`
                            : `Debes a ${balance.memberName}`}
                        </p>
                      </div>
                      <p className={cn("text-sm font-extrabold", balance.direction === "owed_to_you" ? "text-teal" : "text-accent")}> 
                        {formatMoney(balance.amountCents)}
                      </p>
                    </div>
                  ))}
                  {initialSharedBalances.length === 0 ? <p className="rounded-2xl bg-white/70 p-4 text-sm font-semibold text-slate-500">Tus grupos están al día.</p> : null}
                </div>
              </article>
            </div>
          </section>
        </div>
      </main>

      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-24 right-5 z-30 grid size-14 place-items-center rounded-2xl bg-accent text-white shadow-xl shadow-accent/30 sm:hidden"
        aria-label="Agregar movimiento"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <nav className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-around rounded-[1.4rem] border border-slate-200/70 bg-white/95 px-2 py-2 shadow-xl shadow-slate-900/10 backdrop-blur lg:hidden" aria-label="Navegación móvil">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className={cn("flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold", item.active ? "text-brand" : "text-slate-400")}>
              <Icon className="size-5" strokeWidth={item.active ? 2.5 : 2} aria-hidden="true" />
              {item.label === "Presupuesto" ? "Plan" : item.label}
            </Link>
          );
        })}
      </nav>

      {isFormOpen ? (
        <QuickTransactionForm onClose={() => setIsFormOpen(false)} onCreate={addTransaction} allowShared={dataMode === "demo"} />
      ) : null}

      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex justify-center" aria-live="polite">
        {notice ? (
          <div className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-xl">{notice}</div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  icon: Icon,
  tone,
  detail,
}: {
  label: string;
  amount: number;
  icon: typeof ArrowDownLeft;
  tone: "positive" | "negative";
  detail: string;
}) {
  return (
    <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className={cn("grid size-11 place-items-center rounded-2xl", tone === "positive" ? "bg-aqua/30 text-brand" : "bg-cream text-accent")}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{formatMoney(amount)}</p>
      <p className="mt-2 text-xs font-medium text-slate-400">{detail}</p>
    </article>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const meta = categoryMeta[transaction.category];
  const Icon = meta.icon;
  const date = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(new Date(transaction.occurredAt));

  return (
    <div className="flex items-center gap-3 py-4 first:pt-2 last:pb-0 sm:gap-4">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", meta.color)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold sm:text-[15px]">{transaction.title}</p>
          {transaction.scope === "shared" ? (
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 sm:inline">Compartido</span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {meta.label} · {transaction.groupName ?? date}
        </p>
      </div>
      <p className={cn("whitespace-nowrap text-sm font-extrabold sm:text-[15px]", transaction.type === "income" ? "text-teal" : "text-ink")}>
        {transaction.type === "income" ? "+" : "−"}{formatMoney(transaction.amountCents)}
      </p>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("size-2.5 rounded-full", color)} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate font-semibold text-slate-600">{label}</span>
      <span className="font-extrabold text-slate-900">{value}</span>
    </div>
  );
}

function QuickTransactionForm({
  onClose,
  onCreate,
  allowShared,
}: {
  onClose: () => void;
  onCreate: (transaction: Transaction) => void | Promise<void>;
  allowShared: boolean;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [scope, setScope] = useState<TransactionScope>("personal");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const result = createTransactionSchema.safeParse({
      title: formData.get("title"),
      amount: formData.get("amount"),
      category: formData.get("category"),
      type,
      scope,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revisa los datos del movimiento");
      return;
    }

    onCreate({
      id: crypto.randomUUID(),
      title: result.data.title,
      amountCents: Math.round(result.data.amount * 100),
      currency: "MXN",
      type: result.data.type,
      scope: result.data.scope,
      category: result.data.category,
      occurredAt: new Date().toISOString(),
      groupName: result.data.scope === "shared" ? "Casa" : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/65 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="transaction-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal">Registro rápido</p>
            <h2 id="transaction-title" className="mt-1 text-2xl font-extrabold tracking-tight">Nuevo movimiento</h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Cerrar">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form action={handleSubmit} className="mt-6">
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {(["expense", "income"] as const).map((option) => (
              <button key={option} type="button" onClick={() => setType(option)} className={cn("min-h-11 rounded-xl text-sm font-extrabold transition", type === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}>
                {option === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-bold text-slate-700">Cantidad</span>
            <span className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-teal focus-within:ring-4 focus-within:ring-aqua/20">
              <span className="text-xl font-extrabold text-slate-400">$</span>
              <input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" autoFocus placeholder="0.00" className="min-h-14 w-full bg-transparent px-3 text-2xl font-extrabold outline-none" />
              <span className="text-sm font-bold text-slate-400">MXN</span>
            </span>
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold text-slate-700">Concepto</span>
            <input name="title" type="text" placeholder="Ej. Supermercado" className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold outline-none transition focus:border-teal focus:ring-4 focus:ring-aqua/20" />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Categoría</span>
              <select name="category" defaultValue={type === "income" ? "salary" : "food"} className="mt-2 min-h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,transparent_50%,#2E6F73_50%),linear-gradient(135deg,#2E6F73_50%,transparent_50%)] bg-[position:calc(100%-20px)_22px,calc(100%-15px)_22px] bg-[size:5px_5px,5px_5px] bg-no-repeat px-4 text-sm font-semibold outline-none focus:border-teal focus:ring-4 focus:ring-aqua/20">
                {Object.entries(categoryMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </label>
            <div>
              <span className="text-sm font-bold text-slate-700">¿Para quién?</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["personal", ...(allowShared ? ["shared" as const] : [])] as const).map((option) => (
                  <button key={option} type="button" onClick={() => setScope(option)} className={cn("min-h-13 rounded-2xl border text-sm font-bold", scope === option ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-600")}>
                    {option === "personal" ? "Personal" : "Casa"}
                  </button>
                ))}
              </div>
              {!allowShared ? <Link href="/groups" className="mt-2 block text-xs font-bold text-teal">Registra gastos compartidos desde Grupos →</Link> : null}
            </div>
          </div>

          {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <CalendarDays className="size-5 text-slate-400" aria-hidden="true" />
            Se registrará con la fecha y hora actuales
          </div>

          <button type="submit" className="mt-5 min-h-14 w-full rounded-2xl bg-accent px-5 text-base font-extrabold text-white shadow-lg shadow-accent/20 transition hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Guardar movimiento
          </button>
        </form>
      </div>
    </div>
  );
}
