"use client";

import { useEffect, useId, useState } from "react";
import { Pencil, Settings2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type EditModalProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerClassName?: string;
  icon?: "edit" | "settings";
  children: React.ReactNode;
};

export function EditModal({
  title,
  description,
  triggerLabel,
  triggerClassName,
  icon = "edit",
  children,
}: EditModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const TriggerIcon = icon === "settings" ? Settings2 : Pencil;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cream px-4 text-sm font-extrabold text-ink transition hover:bg-gold/55",
          triggerClassName,
        )}
      >
        <TriggerIcon className="size-4" aria-hidden="true" />
        {triggerLabel}
      </button>

      {open ? (
        <div
          className="visual-viewport-overlay fixed inset-x-0 z-50 flex items-end justify-center overflow-hidden bg-navy/65 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="safe-dialog-panel w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:max-w-xl sm:rounded-[2rem] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-xl font-extrabold">{title}</h2>
                {description ? <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-ink" aria-label="Cerrar">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
