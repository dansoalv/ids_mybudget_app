import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/auth";

import { createGroup } from "./actions";

export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  let groups: { id: string; name: string; kind: string; owner_id?: string }[];
  let isAtFreeGroupLimit = false;

  if (configured) {
    const { supabase, user } = await requireUser();
    const [groupsResult, subscriptionResult] = await Promise.all([
      supabase.from("groups").select("id,name,kind,owner_id").is("archived_at", null).order("created_at"),
      supabase.from("subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle(),
    ]);
    groups = groupsResult.data ?? [];
    const currentPlan = subscriptionResult.data?.status === "active" ? subscriptionResult.data.plan : "free";
    const ownedGroups = groups.filter((group) => group.owner_id === user.id).length;
    isAtFreeGroupLimit = currentPlan === "free" && ownedGroups >= 1;
  } else {
    groups = [
      { id: "demo-casa", name: "Casa", kind: "household" },
      { id: "demo-viaje", name: "Viaje Oaxaca", kind: "trip" },
    ];
  }

  return (
    <div className="min-h-dvh bg-surface pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-ink lg:pb-12">
      <AppHeader title="Grupos" />
      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="text-2xl font-extrabold">Gastos en equipo</h2>
          <p className="mt-2 text-slate-500">Crea un espacio para casa, viajes, pareja o amigos.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <Link key={group.id} href={configured ? `/groups/${group.id}` : "/groups"} className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="grid size-12 place-items-center rounded-2xl bg-aqua/25 text-brand"><Users className="size-6" /></span>
                <h3 className="mt-5 text-lg font-extrabold">{group.name}</h3>
                <p className="mt-1 text-sm capitalize text-slate-500">{group.kind}</p>
              </Link>
            ))}
          </div>
          {!configured ? <p className="mt-5 rounded-2xl bg-cream p-4 text-sm font-semibold text-ink">Vista demostrativa. Conecta Supabase para crear y compartir grupos reales.</p> : null}
        </section>
        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent text-ink"><Plus className="size-6" /></span>
          <h2 className="mt-5 text-xl font-extrabold">Nuevo grupo</h2>
          <form action={configured ? createGroup : undefined} className="mt-5 space-y-4">
            <label className="block"><span className="text-sm font-bold">Nombre</span><input name="name" required minLength={2} placeholder="Ej. Casa" className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-teal" /></label>
            <label className="block"><span className="text-sm font-bold">Tipo</span><select name="kind" className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 bg-white px-4"><option value="household">Hogar o pareja</option><option value="trip">Viaje</option><option value="friends">Amigos</option><option value="other">Otro</option></select></label>
            {error ? <p className="rounded-xl bg-accent/15 px-3 py-2 text-sm font-semibold text-ink">{error}</p> : null}
            {isAtFreeGroupLimit ? <p className="rounded-2xl bg-cream p-4 text-sm font-semibold leading-6 text-ink">Ya utilizaste el grupo incluido en Gratis. <Link href="/profile#subscription" className="underline underline-offset-4">Compara los planes</Link>.</p> : null}
            <button disabled={!configured || isAtFreeGroupLimit} className="min-h-13 w-full rounded-2xl bg-gold px-5 font-extrabold text-ink disabled:opacity-40">Crear grupo</button>
          </form>
        </aside>
      </main>
      <MobileNavigation active="groups" />
    </div>
  );
}
