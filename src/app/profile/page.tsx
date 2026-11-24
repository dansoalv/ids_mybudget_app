import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Coins,
  Crown,
  Gem,
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
  subscriptionPlan: "free" | "plus" | "family";
  ownedGroupCount: number;
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

        <SubscriptionSection plan={profile.subscriptionPlan} ownedGroupCount={profile.ownedGroupCount} />
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
      subscriptionPlan: "free",
      ownedGroupCount: 1,
      mode: "demo",
    };
  }

  const { supabase, user } = await requireUser();
  const [profileResult, subscriptionResult, groupsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,default_currency,locale,timezone,created_at")
      .eq("id", user.id)
      .single(),
    supabase.from("subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle(),
    supabase.from("groups").select("id", { count: "exact", head: true }).eq("owner_id", user.id).is("archived_at", null),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error("No se pudo consultar el perfil");
  }

  const subscriptionPlan = subscriptionResult.data?.status === "active"
    ? subscriptionResult.data.plan
    : "free";

  return {
    displayName: profileResult.data.display_name,
    email: user.email ?? "Correo no disponible",
    currency: profileResult.data.default_currency,
    locale: profileResult.data.locale,
    timezone: profileResult.data.timezone,
    createdAt: profileResult.data.created_at,
    subscriptionPlan,
    ownedGroupCount: groupsResult.count ?? 0,
    mode: "live",
  };
}

const planDetails = [
  {
    id: "free" as const,
    name: "Gratis",
    description: "Lo esencial para ordenar tus finanzas y comenzar a compartir.",
    icon: BadgeCheck,
    features: ["Acceso seguro y perfil personal", "Movimientos personales", "1 grupo compartido", "Divisiones y liquidaciones básicas"],
  },
  {
    id: "plus" as const,
    name: "Plus",
    description: "Más control para quienes administran varios espacios y objetivos.",
    icon: Crown,
    features: ["Todo lo incluido en Gratis", "Grupos ilimitados", "Presupuestos configurables", "Movimientos recurrentes y recordatorios", "Exportación de información"],
  },
  {
    id: "family" as const,
    name: "Familia",
    description: "Organización avanzada para hogares y equipos que comparten más.",
    icon: Gem,
    features: ["Todo lo incluido en Plus", "Planes y metas compartidas", "Roles y permisos avanzados", "Historial familiar ampliado", "Soporte prioritario"],
  },
];

function SubscriptionSection({ plan, ownedGroupCount }: { plan: ProfileData["subscriptionPlan"]; ownedGroupCount: number }) {
  const freeUsage = Math.min(ownedGroupCount, 1);

  return (
    <section id="subscription" className="scroll-mt-28 pt-7" aria-labelledby="subscription-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-teal">Suscripción</p>
          <h2 id="subscription-title" className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Un plan para cada etapa</h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-500">Todas las cuentas comienzan en Gratis. Plus y Familia estarán disponibles en una siguiente etapa.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-white">
          Plan actual: {planDetails.find((item) => item.id === plan)?.name ?? "Gratis"}
        </span>
      </div>

      {plan === "free" ? (
        <div className="mt-5 rounded-[1.75rem] bg-cream p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div><p className="font-extrabold">Uso de grupos</p><p className="mt-1 text-sm text-slate-600">Tu plan incluye la creación de un grupo compartido.</p></div>
          <div className="mt-4 min-w-52 sm:mt-0">
            <div className="flex items-center justify-between text-sm font-bold"><span>{freeUsage} de 1 utilizado</span><span>{freeUsage * 100}%</span></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand" style={{ width: `${freeUsage * 100}%` }} /></div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {planDetails.map((item) => {
          const Icon = item.icon;
          const isCurrent = item.id === plan;
          return (
            <article key={item.id} className={`relative rounded-[2rem] border p-6 shadow-sm ${isCurrent ? "border-brand bg-white ring-4 ring-brand/8" : "border-slate-200/70 bg-white"}`}>
              {isCurrent ? <span className="absolute right-5 top-5 rounded-full bg-brand px-3 py-1 text-xs font-extrabold text-white">Plan actual</span> : null}
              <span className={`grid size-12 place-items-center rounded-2xl ${item.id === "free" ? "bg-aqua/25 text-brand" : item.id === "plus" ? "bg-cream text-accent" : "bg-ink text-aqua"}`}><Icon className="size-6" /></span>
              <h3 className="mt-5 text-2xl font-extrabold">{item.name}</h3>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">{item.description}</p>
              <ul className="mt-5 space-y-3">
                {item.features.map((feature) => <li key={feature} className="flex gap-3 text-sm font-semibold text-slate-600"><Check className="mt-0.5 size-4 shrink-0 text-teal" />{feature}</li>)}
              </ul>
              <div className={`mt-6 flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-extrabold ${isCurrent ? "bg-slate-100 text-slate-500" : "bg-ink text-white"}`}>
                {isCurrent ? "Tu plan actual" : "Próximamente"}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
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
