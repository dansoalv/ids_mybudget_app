import { WalletCards } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-surface text-ink" role="status" aria-label="Cargando contenido">
      <header className="safe-header bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 pb-5 sm:px-8">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent">
            <WalletCards className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold text-white/45">MyBudget</p>
            <p className="font-extrabold">Preparando tu información</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl animate-pulse px-5 py-7 sm:px-8">
        <div className="h-4 w-36 rounded-full bg-aqua/45" />
        <div className="mt-4 h-9 w-3/4 max-w-lg rounded-2xl bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-slate-200" />
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="h-40 rounded-[2rem] bg-brand/15" />
          <div className="h-40 rounded-[2rem] bg-white shadow-sm" />
          <div className="h-40 rounded-[2rem] bg-white shadow-sm" />
        </section>
        <div className="mt-6 h-80 rounded-[2rem] bg-white shadow-sm" />
      </main>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
