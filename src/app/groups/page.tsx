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
  const groups = configured
    ? ((await (await requireUser()).supabase.from("groups").select("id,name,kind").is("archived_at", null).order("created_at")).data ?? [])
    : [
        { id: "demo-casa", name: "Casa", kind: "household" },
        { id: "demo-viaje", name: "Viaje Oaxaca", kind: "trip" },
      ];

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
          {!configured ? <p className="mt-5 rounded-2xl bg-cream p-4 text-sm font-semibold text-brand">Vista demostrativa. Conecta Supabase para crear y compartir grupos reales.</p> : null}
        </section>
        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent text-white"><Plus className="size-6" /></span>
          <h2 className="mt-5 text-xl font-extrabold">Nuevo grupo</h2>
          <form action={configured ? createGroup : undefined} className="mt-5 space-y-4">
            <label className="block"><span className="text-sm font-bold">Nombre</span><input name="name" required minLength={2} placeholder="Ej. Casa" className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-teal" /></label>
            <label className="block"><span className="text-sm font-bold">Tipo</span><select name="kind" className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 bg-white px-4"><option value="household">Hogar o pareja</option><option value="trip">Viaje</option><option value="friends">Amigos</option><option value="other">Otro</option></select></label>
            {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
            <button disabled={!configured} className="min-h-13 w-full rounded-2xl bg-brand px-5 font-extrabold text-white disabled:opacity-40">Crear grupo</button>
          </form>
        </aside>
      </main>
      <MobileNavigation active="groups" />
    </div>
  );
}
