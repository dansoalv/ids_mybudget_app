import type { Metadata } from "next";
import { WalletCards } from "lucide-react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acceso" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent text-white"><WalletCards className="size-6" /></span>
            <div><p className="text-xl font-extrabold">MyBudget</p><p className="text-sm text-slate-500">Dinero en equipo</p></div>
          </div>
          <h1 className="mt-10 text-3xl font-extrabold tracking-tight">Tus finanzas, más claras.</h1>
          <p className="mt-3 text-slate-500">Registra, comparte y liquida gastos sin hojas de cálculo ni cuentas confusas.</p>
          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-brand/8 sm:p-8">
            <LoginForm next={next} />
          </div>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-28 -top-28 size-96 rounded-full bg-teal/45 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-accent/35 blur-3xl" />
        <div className="relative max-w-xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-aqua">Presupuesto compartido</p>
          <h2 className="mt-5 text-5xl font-extrabold leading-tight tracking-[-0.04em]">Cada gasto en su lugar. Cada deuda, resuelta.</h2>
          <p className="mt-5 text-lg leading-8 text-white/60">Diseñada para tu mes, tu pareja, tus amigos y esos viajes que merecen menos cuentas y más recuerdos.</p>
        </div>
      </section>
    </main>
  );
}
