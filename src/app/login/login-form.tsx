"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { signIn, signUp, type AuthActionState } from "./actions";

const initialState: AuthActionState = {};

export function LoginForm({ next = "/" }: { next?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);
  const state = mode === "signin" ? signInState : signUpState;
  const pending = signInPending || signUpPending;

  return (
    <div>
      <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => setMode("signin")} className={`min-h-11 rounded-xl text-sm font-bold ${mode === "signin" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}>
          Iniciar sesión
        </button>
        <button type="button" onClick={() => setMode("signup")} className={`min-h-11 rounded-xl text-sm font-bold ${mode === "signup" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}>
          Crear cuenta
        </button>
      </div>

      <form action={mode === "signin" ? signInAction : signUpAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        {mode === "signup" ? (
          <Field label="Nombre" name="displayName" type="text" autoComplete="name" placeholder="Tu nombre" />
        ) : null}
        <Field label="Correo" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" />
        <Field label="Contraseña" name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Mínimo 8 caracteres" />

        {state.error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{state.error}</p> : null}
        {state.message ? <p className="rounded-2xl bg-aqua/20 px-4 py-3 text-sm font-semibold text-brand" role="status">{state.message}</p> : null}

        <button disabled={pending} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-extrabold text-white shadow-lg shadow-accent/20 disabled:opacity-60">
          {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : null}
          {mode === "signin" ? "Entrar a MyBudget" : "Crear mi cuenta"}
        </button>
      </form>
    </div>
  );
}

function Field(props: { label: string; name: string; type: string; autoComplete: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{props.label}</span>
      <input {...props} required className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none transition focus:border-teal focus:ring-4 focus:ring-aqua/20" />
    </label>
  );
}
