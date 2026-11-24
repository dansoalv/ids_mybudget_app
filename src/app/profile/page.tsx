import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarDays,
  Coins,
  Languages,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { signOut } from "@/app/login/actions";
import { AppHeader } from "@/components/app-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

type ProfileData = {
  displayName: string;
  email: string;
  currency: string;
  locale: string;
  timezone: string;
  createdAt: string;
  mode: "demo" | "live";
};

export default async function ProfilePage() {
  const profile = await readProfile();
  const initials = profile.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-surface pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-ink lg:pb-12">
      <AppHeader title="Perfil" />
      <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2rem] bg-ink text-white shadow-xl shadow-brand/10">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-14 -top-20 size-60 rounded-full bg-brand/35 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="grid size-20 shrink-0 place-items-center rounded-[1.75rem] bg-accent text-2xl font-extrabold text-white shadow-lg shadow-black/20">
                {initials || "U"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-aqua">Tu cuenta</p>
                <h1 className="mt-1 truncate text-3xl font-extrabold tracking-[-0.04em]">{profile.displayName}</h1>
                <p className="mt-2 flex items-center gap-2 truncate text-sm text-white/55">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  {profile.email}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-bold text-aqua">
                <BadgeCheck className="size-4" aria-hidden="true" />
                {profile.mode === "live" ? "Cuenta sincronizada" : "Modo demostración"}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-cream text-brand"><UserRound className="size-5" /></span>
              <div><p className="text-sm font-bold text-teal">Información básica</p><h2 className="text-xl font-extrabold">Preferencias de tu cuenta</h2></div>
            </div>
            <dl className="mt-6 divide-y divide-slate-100">
              <ProfileRow icon={Coins} label="Moneda principal" value={profile.currency} />
              <ProfileRow icon={Languages} label="Idioma" value={localeLabel(profile.locale)} />
              <ProfileRow icon={MapPin} label="Zona horaria" value={profile.timezone} />
              <ProfileRow icon={CalendarDays} label="Miembro desde" value={formatDate(profile.createdAt)} />
            </dl>
          </article>

          <aside className="h-fit rounded-[2rem] bg-cream p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-white text-accent"><ShieldCheck className="size-5" /></span>
            <h2 className="mt-5 text-xl font-extrabold">Sesión y privacidad</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tus movimientos y grupos están asociados únicamente con esta cuenta.
            </p>
            {profile.mode === "live" ? (
              <form action={signOut} className="mt-6">
                <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 font-extrabold text-white">
                  <LogOut className="size-5" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </form>
            ) : (
              <p className="mt-6 rounded-2xl bg-white/70 p-4 text-sm font-semibold text-brand">Conecta Supabase para consultar los datos de una cuenta real.</p>
            )}
          </aside>
        </section>
      </main>
      <MobileNavigation active="profile" />
    </div>
  );
}

async function readProfile(): Promise<ProfileData> {
  if (!isSupabaseConfigured()) {
    return {
      displayName: "Daniel Sánchez",
      email: "daniel@ejemplo.com",
      currency: "MXN",
      locale: "es-MX",
      timezone: "America/Mexico_City",
      createdAt: "2026-11-01T12:00:00.000Z",
      mode: "demo",
    };
  }

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name,default_currency,locale,timezone,created_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("No se pudo consultar el perfil");
  }

  return {
    displayName: data.display_name,
    email: user.email ?? "Correo no disponible",
    currency: data.default_currency,
    locale: data.locale,
    timezone: data.timezone,
    createdAt: data.created_at,
    mode: "live",
  };
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-brand"><Icon className="size-5" /></span>
      <dt className="min-w-0 flex-1 text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="max-w-[55%] break-words text-right text-sm font-extrabold text-ink">{value}</dd>
    </div>
  );
}

function localeLabel(locale: string) {
  if (locale === "es-MX") return "Español (México)";
  return locale;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}
