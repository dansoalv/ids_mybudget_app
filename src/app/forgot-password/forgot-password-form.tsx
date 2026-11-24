"use client";

import { useActionState } from "react";
import { LoaderCircle, Mail } from "lucide-react";

import { requestPasswordReset, type AuthActionState } from "@/app/login/actions";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={action} className="mt-7 space-y-5">
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Correo de tu cuenta</span>
        <span className="relative mt-2 block">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="tu@correo.com"
            className="min-h-14 w-full rounded-2xl border border-slate-200 pl-12 pr-4 font-semibold outline-none transition focus:border-teal focus:ring-4 focus:ring-aqua/20"
          />
        </span>
      </label>

      {state.error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{state.error}</p> : null}
      {state.message ? <p className="rounded-2xl bg-aqua/20 px-4 py-3 text-sm font-semibold leading-6 text-brand" role="status">{state.message}</p> : null}

      <button disabled={pending} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-extrabold text-white shadow-lg shadow-accent/20 disabled:opacity-60">
        {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : null}
        Enviar enlace de recuperación
      </button>
    </form>
  );
}
