import { UserPlus } from "lucide-react";

import { acceptInvitation } from "@/app/groups/actions";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await requireUser();

  return (
    <div className="min-h-dvh bg-surface pb-[env(safe-area-inset-bottom)]">
      <AppHeader title="Invitación" />
      <main className="grid place-items-center px-5 py-16">
        <section className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-brand/8">
          <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-cream text-accent"><UserPlus className="size-7" /></span>
          <h1 className="mt-6 text-2xl font-extrabold">Te invitaron a un grupo</h1>
          <p className="mt-3 leading-6 text-slate-500">Al aceptar podrás ver gastos, agregar movimientos y liquidar saldos con sus integrantes.</p>
          <form action={acceptInvitation} className="mt-7"><input type="hidden" name="token" value={token} /><button className="min-h-14 w-full rounded-2xl bg-accent px-5 font-extrabold text-white">Aceptar invitación</button></form>
        </section>
      </main>
    </div>
  );
}
