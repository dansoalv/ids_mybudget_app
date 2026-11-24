"use client";

import Link from "next/link";
import { Home, ReceiptText, UserRound, Users, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";

import { LinkPendingIndicator } from "./link-pending-indicator";

const items = [
  { id: "home", label: "Inicio", href: "/", icon: Home },
  { id: "transactions", label: "Movimientos", href: "/transactions", icon: ReceiptText },
  { id: "groups", label: "Grupos", href: "/groups", icon: Users },
  { id: "plan", label: "Plan", href: "/plan", icon: WalletCards },
  { id: "profile", label: "Perfil", href: "/profile", icon: UserRound },
] as const;

export function MobileNavigation({ active }: { active: (typeof items)[number]["id"] }) {
  return (
    <nav
      className="safe-bottom-nav fixed inset-x-0 bottom-0 z-20 flex items-center justify-around rounded-t-[1.4rem] border border-slate-200/70 bg-white/95 px-2 pt-2 shadow-xl shadow-slate-900/10 backdrop-blur sm:inset-x-3 sm:rounded-[1.4rem] sm:pb-2 lg:hidden"
      aria-label="Navegación móvil"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-bold",
              isActive ? "text-brand" : "text-slate-400",
            )}
          >
            <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
            {item.label}
            <LinkPendingIndicator />
          </Link>
        );
      })}
    </nav>
  );
}
