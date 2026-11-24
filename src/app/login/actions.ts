"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
};

const credentialsSchema = z.object({
  email: z.email("Escribe un correo válido").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

function safeDestination(value: FormDataEntryValue | null) {
  const destination = typeof value === "string" ? value : "/";
  return destination.startsWith("/") && !destination.startsWith("//") ? destination : "/";
}

export async function signIn(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos" };

  redirect(safeDestination(formData.get("next")));
}

export async function signUp(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema
    .extend({ displayName: z.string().trim().min(2, "Escribe tu nombre").max(80) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) return { error: "No pudimos crear la cuenta. Intenta con otro correo." };
  return { message: "Cuenta creada. Revisa tu correo para confirmar el acceso." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
