"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
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
  SlidersHorizontal,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";

import { signOut } from "@/app/login/actions";
import { cn } from "@/lib/utils";

export type ProfileData = {
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

type ProfileSection = "account" | "subscription";
type PlanId = ProfileData["subscriptionPlan"];

const planDetails: Array<{
  id: PlanId;
  name: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  features: string[];
}> = [
  {
    id: "free",
    name: "Gratis",
    eyebrow: "Para comenzar",
    description: "Lo esencial para ordenar tus finanzas y compartir un espacio.",
    icon: BadgeCheck,
    tone: "bg-aqua/25 text-brand",
    features: ["Acceso seguro y perfil personal", "Movimientos personales", "1 grupo compartido", "Divisiones y liquidaciones básicas"],
  },
  {
    id: "plus",
    name: "Plus",
    eyebrow: "Más control",
    description: "Para administrar varios espacios, presupuestos y objetivos.",
    icon: Crown,
    tone: "bg-cream text-accent",
    features: ["Todo lo incluido en Gratis", "Grupos ilimitados", "Presupuestos configurables", "Movimientos recurrentes y recordatorios", "Exportación de información"],
  },
  {
    id: "family",
    name: "Familia",
    eyebrow: "Todo en equipo",
    description: "Organización avanzada para hogares que comparten más.",
    icon: Gem,
    tone: "bg-orange text-ink",
    features: ["Todo lo incluido en Plus", "Planes y metas compartidas", "Roles y permisos avanzados", "Historial familiar ampliado", "Soporte prioritario"],
  },
];
const freePlan = planDetails[0]!;

export function ProfileContent({ profile }: { profile: ProfileData }) {
  const [section, setSection] = useState<ProfileSection>("account");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(profile.subscriptionPlan);
  const initials = profile.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const currentPlan = planDetails.find((item) => item.id === profile.subscriptionPlan) ?? freePlan;

  function openSubscription() {
    setSelectedPlan(profile.subscriptionPlan);
    setSection("subscription");
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] bg-orange p-5 text-ink shadow-xl shadow-orange/15 sm:p-7">
        <div className="absolute -right-14 -top-24 size-64 rounded-full bg-gold/60 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-[1.4rem] bg-accent text-xl font-extrabold shadow-lg shadow-black/20">{initials || "U"}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-bold text-ink/65"><UserRound className="size-4" />Mi perfil</div>
            <h1 className="mt-1 truncate text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">{profile.displayName}</h1>
            <p className="mt-1 flex items-center gap-2 truncate text-sm text-ink/60"><Mail className="size-4 shrink-0" />{profile.email}</p>
          </div>
          <button type="button" onClick={openSubscription} className="flex min-h-11 items-center gap-2 rounded-2xl bg-white/55 px-4 text-sm font-extrabold text-ink">
            <currentPlan.icon className="size-4" />
            {currentPlan.name}
          </button>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-200/60 p-1" role="tablist" aria-label="Secciones del perfil">
        <SectionTab active={section === "account"} icon={SlidersHorizontal} onClick={() => setSection("account")}>Cuenta</SectionTab>
        <SectionTab active={section === "subscription"} icon={WalletCards} onClick={() => setSection("subscription")}>Suscripción</SectionTab>
      </div>

      <div className="mt-5">
        {section === "account" ? <AccountPanel profile={profile} /> : <SubscriptionPanel profile={profile} selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />}
      </div>
    </>
  );
}

function SectionTab({ active, icon: Icon, onClick, children }: { active: boolean; icon: LucideIcon; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition", active ? "bg-white text-ink shadow-sm" : "text-ink/55")}>
      <Icon className="size-4" />{children}
    </button>
  );
}

function AccountPanel({ profile }: { profile: ProfileData }) {
  return (
    <section role="tabpanel" aria-label="Cuenta" className="grid gap-5 lg:grid-cols-[1fr_0.68fr]">
      <article className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-cream text-brand"><SlidersHorizontal className="size-5" /></span>
          <div><p className="text-sm font-bold text-ink/65">Cuenta</p><h2 className="text-xl font-extrabold">Tus preferencias</h2></div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile icon={Coins} label="Moneda" value={profile.currency} />
          <InfoTile icon={Languages} label="Idioma" value={localeLabel(profile.locale)} />
          <InfoTile icon={MapPin} label="Zona horaria" value={profile.timezone} />
          <InfoTile icon={CalendarDays} label="Miembro desde" value={formatDate(profile.createdAt)} />
        </dl>
      </article>

      <aside className="rounded-[2rem] bg-cream p-5 sm:p-7">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white text-accent"><ShieldCheck className="size-5" /></span><div><p className="text-sm font-bold text-ink/65">Seguridad</p><h2 className="text-xl font-extrabold">Tu sesión</h2></div></div>
        <p className="mt-4 text-sm leading-6 text-slate-600">Tus movimientos y grupos están asociados únicamente con esta cuenta.</p>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-ink"><BadgeCheck className="size-4" />{profile.mode === "live" ? "Cuenta sincronizada" : "Modo demostración"}</div>
        {profile.mode === "live" ? (
          <form action={signOut} className="mt-4">
            <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-extrabold text-ink"><LogOut className="size-5" />Cerrar sesión</button>
          </form>
        ) : null}
      </aside>
    </section>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm"><Icon className="size-5" /></span>
      <div className="min-w-0"><dt className="text-xs font-bold text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-extrabold text-ink">{value}</dd></div>
    </div>
  );
}

function SubscriptionPanel({ profile, selectedPlan, onSelectPlan }: { profile: ProfileData; selectedPlan: PlanId; onSelectPlan: (plan: PlanId) => void }) {
  const detail = planDetails.find((item) => item.id === selectedPlan) ?? freePlan;
  const DetailIcon = detail.icon;
  const freeUsage = Math.min(profile.ownedGroupCount, 1);
  const isCurrent = selectedPlan === profile.subscriptionPlan;

  return (
    <section role="tabpanel" aria-label="Suscripción" className="grid items-start gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-[2rem] bg-orange p-5 text-ink sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-ink/65">Plan actual</p><h2 className="mt-1 text-2xl font-extrabold">{planDetails.find((item) => item.id === profile.subscriptionPlan)?.name}</h2></div><Sparkles className="size-6 text-ink" /></div>
        {profile.subscriptionPlan === "free" ? (
          <div className="mt-5 rounded-2xl bg-white/45 p-4">
            <div className="flex items-center justify-between text-sm font-bold"><span>Grupos</span><span>{freeUsage} de 1</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-navy" style={{ width: `${freeUsage * 100}%` }} /></div>
          </div>
        ) : null}
        <p className="mt-4 text-sm leading-6 text-ink/60">Todas las cuentas comienzan en Gratis. Los planes superiores estarán disponibles próximamente.</p>
      </aside>

      <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid grid-cols-3 gap-2" aria-label="Comparar planes">
          {planDetails.map((plan) => (
            <button key={plan.id} type="button" aria-pressed={selectedPlan === plan.id} onClick={() => onSelectPlan(plan.id)} className={cn("min-h-11 rounded-xl px-2 text-sm font-extrabold transition", selectedPlan === plan.id ? "bg-gold text-ink" : "bg-slate-100 text-slate-500")}>
              {plan.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-4">
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", detail.tone)}><DetailIcon className="size-6" /></span>
          <div><p className="text-sm font-bold text-ink/65">{detail.eyebrow}</p><h2 className="text-2xl font-extrabold">Plan {detail.name}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{detail.description}</p></div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {detail.features.map((feature) => <li key={feature} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600"><Check className="mt-0.5 size-4 shrink-0 text-teal" />{feature}</li>)}
        </ul>

        <div className={cn("mt-6 flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-extrabold", isCurrent ? "bg-slate-100 text-slate-500" : "bg-accent text-ink")}>
          {isCurrent ? "Tu plan actual" : "Próximamente"}
        </div>
      </div>
    </section>
  );
}

function localeLabel(locale: string) {
  return locale === "es-MX" ? "Español (México)" : locale;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}
