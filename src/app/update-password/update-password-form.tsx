"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { updatePassword, type AuthActionState } from "@/app/login/actions";

const initialState: AuthActionState = {};

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="mt-7 space-y-4">
      <PasswordField label="Contraseña nueva" name="password" autoComplete="new-password" />
      <PasswordField label="Confirma la contraseña" name="confirmPassword" autoComplete="new-password" />

      {state.error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{state.error}</p> : null}

      <button disabled={pending} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-extrabold text-white shadow-lg shadow-accent/20 disabled:opacity-60">
        {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : null}
        Guardar contraseña nueva
      </button>
    </form>
  );
}

function PasswordField({ label, name, autoComplete }: { label: string; name: string; autoComplete: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        minLength={8}
        placeholder="Mínimo 8 caracteres"
        className="mt-2 min-h-14 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none transition focus:border-teal focus:ring-4 focus:ring-aqua/20"
      />
    </label>
  );
}
