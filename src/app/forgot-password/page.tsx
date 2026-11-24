import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound, WalletCards } from "lucide-react";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <main className="safe-screen grid min-h-dvh bg-surface lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent text-ink"><WalletCards className="size-6" /></span>
            <div><p className="text-xl font-extrabold">MyBudget</p><p className="text-sm text-slate-500">Dinero en equipo</p></div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-xl shadow-brand/8 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-cream text-brand"><KeyRound className="size-6" /></span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em]">Recupera tu acceso</h1>
            <p className="mt-3 leading-7 text-slate-500">Escribe el correo de tu cuenta y te enviaremos un enlace seguro para crear una contraseña nueva.</p>
            <ForgotPasswordForm />
            <Link href="/login" className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-slate-500 hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-gold p-12 text-ink lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-28 -top-28 size-96 rounded-full bg-orange/55 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-accent/35 blur-3xl" />
        <div className="relative max-w-xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-ink/65">Acceso protegido</p>
          <h2 className="mt-5 text-5xl font-extrabold leading-tight tracking-[-0.04em]">Vuelve a tus finanzas sin perder tus datos.</h2>
          <p className="mt-5 text-lg leading-8 text-ink/65">El enlace es temporal y solo permite establecer una contraseña nueva para tu cuenta.</p>
        </div>
      </section>
    </main>
  );
}
