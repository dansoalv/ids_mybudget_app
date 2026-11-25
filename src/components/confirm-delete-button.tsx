"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ConfirmDeleteButtonProps = {
  message: string;
  label?: string;
  className?: string;
};

export function ConfirmDeleteButton({
  message,
  label = "Eliminar",
  className,
}: ConfirmDeleteButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent/12 px-4 text-sm font-extrabold text-accent transition hover:bg-accent/20 disabled:opacity-60",
        className,
      )}
    >
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? "Eliminando…" : label}
    </button>
  );
}
