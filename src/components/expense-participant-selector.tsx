"use client";

import { useState } from "react";
import { Check, Users } from "lucide-react";

import { cn } from "@/lib/utils";

type Participant = {
  id: string;
  name: string;
};

type ExpenseParticipantSelectorProps = {
  participants: Participant[];
  defaultSelectedIds?: string[];
  className?: string;
};

export function ExpenseParticipantSelector({
  participants,
  defaultSelectedIds,
  className,
}: ExpenseParticipantSelectorProps) {
  const [selectedIds, setSelectedIds] = useState(() => {
    const availableIds = new Set(participants.map((participant) => participant.id));
    const initialIds = defaultSelectedIds ?? participants.map((participant) => participant.id);
    return new Set(initialIds.filter((id) => availableIds.has(id)));
  });
  const allSelected = participants.length > 0 && selectedIds.size === participants.length;

  function toggleParticipant(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(participants.map((participant) => participant.id)));
  }

  return (
    <fieldset className={cn("rounded-2xl border border-slate-200 bg-slate-50 p-4", className)}>
      <legend className="sr-only">Personas que participan en el gasto</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="font-extrabold text-ink">¿Entre quiénes se divide?</p>
          <p className="mt-1 text-sm leading-5 text-slate-500">El importe se repartirá por igual sólo entre las personas seleccionadas.</p>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="w-full shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-brand shadow-sm sm:w-auto"
        >
          {allSelected ? "Quitar todos" : "Seleccionar todos"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {participants.map((participant) => {
          const selected = selectedIds.has(participant.id);
          return (
            <label
              key={participant.id}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition",
                selected ? "border-brand bg-aqua/25" : "border-slate-200 bg-white",
              )}
            >
              <input
                type="checkbox"
                name="participantIds"
                value={participant.id}
                checked={selected}
                onChange={() => toggleParticipant(participant.id)}
                className="sr-only"
              />
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", selected ? "bg-brand text-white" : "bg-slate-100 text-slate-400")}>
                {selected ? <Check className="size-4" aria-hidden="true" /> : <Users className="size-4" aria-hidden="true" />}
              </span>
              <span className="min-w-0 truncate text-sm font-bold text-ink">{participant.name}</span>
            </label>
          );
        })}
      </div>

      <p className={cn("mt-3 text-sm font-bold", selectedIds.size > 0 ? "text-brand" : "text-accent")} role="status">
        {selectedIds.size > 0
          ? `${selectedIds.size} ${selectedIds.size === 1 ? "participante seleccionado" : "participantes seleccionados"}`
          : "Selecciona al menos una persona"}
      </p>
    </fieldset>
  );
}
