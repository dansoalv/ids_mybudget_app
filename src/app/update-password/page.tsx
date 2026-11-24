import type { Metadata } from "next";
import { KeyRound, ShieldCheck, WalletCards } from "lucide-react";

import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function UpdatePasswordPage() {
  return (
    <main className="safe-screen grid min-h-dvh bg-surface lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent text-white"><WalletCards className="size-6" /></span>
            <div><p className="text-xl font-extrabold">MyBudget</p><p className="text-sm text-slate-500">Dinero en equipo</p></div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-xl shadow-brand/8 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-aqua/25 text-brand"><KeyRound className="size-6" /></span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em]">Crea una contraseña nueva</h1>
            <p className="mt-3 leading-7 text-slate-500">Usa al menos 8 caracteres y evita reutilizar una contraseña de otra cuenta.</p>
            <UpdatePasswordForm />
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-28 -top-28 size-96 rounded-full bg-teal/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-brand/35 blur-3xl" />
        <div className="relative max-w-xl">
          <ShieldCheck className="size-10 text-aqua" />
          <h2 className="mt-5 text-5xl font-extrabold leading-tight tracking-[-0.04em]">Una contraseña nueva, la misma información segura.</h2>
          <p className="mt-5 text-lg leading-8 text-white/60">Al guardarla cerraremos la sesión de recuperación y podrás volver a entrar normalmente.</p>
        </div>
      </section>
    </main>
  );
}
