"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthActionState = {
  error?: string;
  message?: string;
};

const credentialsSchema = z.object({
  email: z.email("Escribe un correo válido").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const emailSchema = z.object({
  email: z.email("Escribe un correo válido").transform((value) => value.toLowerCase()),
});

const passwordUpdateSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
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

export async function requestPasswordReset(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const successMessage = "Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.";
  if (!isSupabaseConfigured()) return { message: successMessage };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set("next", "/update-password");

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl.toString(),
  });

  if (error) return { error: "No pudimos enviar el enlace. Espera un momento e intenta de nuevo." };
  return { message: successMessage };
}

export async function updatePassword(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = passwordUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    return { error: "El enlace ya no es válido. Solicita uno nuevo." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "No pudimos actualizar la contraseña. Intenta usar una diferente." };

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
