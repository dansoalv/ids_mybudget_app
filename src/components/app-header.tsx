import Link from "next/link";
import { ArrowLeft, WalletCards } from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";

export function AppHeader({ title, backHref = "/" }: { title: string; backHref?: string }) {
  return (
    <header className="safe-header border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 pb-5 sm:px-8">
        <Link href={backHref} className="relative grid size-11 place-items-center rounded-2xl bg-white/8" aria-label="Volver">
          <ArrowLeft className="size-5" />
          <LinkPendingIndicator />
        </Link>
        <span className="grid size-11 place-items-center rounded-2xl bg-accent"><WalletCards className="size-5" /></span>
        <div><p className="text-xs font-bold text-white/45">MyBudget</p><h1 className="text-lg font-extrabold">{title}</h1></div>
      </div>
    </header>
  );
}
