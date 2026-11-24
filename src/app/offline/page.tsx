import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="safe-screen grid min-h-dvh place-items-center bg-surface px-5 text-ink">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-brand/10">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-cream text-accent">
          <WifiOff className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold">Estás sin conexión</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Tus movimientos nuevos quedan guardados en este dispositivo y se sincronizan al recuperar internet.
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-brand px-5 font-bold text-white">
          Volver a intentar
        </Link>
      </section>
    </main>
  );
}
