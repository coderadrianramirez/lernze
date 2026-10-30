"use client";
import { useActionState, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteProgramAction } from "./actions";

export function DeleteProgram({
  slug,
  title,
  enabled,
  members,
}: {
  slug: string;
  title: string;
  enabled: boolean;
  members: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    deleteProgramAction.bind(null, slug),
    {},
  );
  return (
    <section className="mt-10 rounded-2xl border border-bad/25 bg-surface p-5">
      <h2 className="font-display text-lg font-bold">Eliminar programa</h2>
      <p className="mt-2 text-sm text-muted">
        Elimina el programa, sus clases y sus archivos de Lernze. Esta acción es
        permanente.
      </p>
      {!enabled && (
        <p className="mt-2 text-xs text-muted">
          Esta opción estará disponible en breve.
        </p>
      )}
      <button
        type="button"
        disabled={!enabled}
        onClick={() => setOpen(true)}
        className="mt-4 cursor-pointer rounded-lg border border-bad/40 px-4 py-2.5 text-sm font-semibold text-bad disabled:cursor-default disabled:opacity-40"
      >
        Eliminar programa…
      </button>
      <ConfirmDialog
        open={open}
        title="¿Eliminar este programa?"
        busy={pending}
        onClose={() => setOpen(false)}
      >
        <p className="break-words text-sm font-semibold">{title}</p>
        <p className="mt-3 text-sm text-muted">
          Se eliminarán sus clases, portadas, videos y el progreso asociado. No
          podrás recuperarlos desde Lernze.
        </p>
        <p className="mt-3 rounded-xl border border-bad/30 bg-bad/10 p-3 text-sm">
          {members
            ? "Este programa tiene alumnos. Perderán el acceso al eliminarlo."
            : "Si alguien se une antes de confirmar, también perderá el acceso."}
        </p>
        <form key={open ? "open" : "closed"} action={action} className="mt-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              name="confirmed"
              type="checkbox"
              required
              value="yes"
              className="mt-1 accent-accent"
            />
            Entiendo que esta eliminación es permanente y que los alumnos
            perderán el acceso.
          </label>
          {state.error && (
            <p role="alert" className="mt-3 text-sm text-bad">
              {state.error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="flex-1 cursor-pointer rounded-lg border border-line px-4 py-3 text-sm font-semibold"
            >
              Conservar programa
            </button>
            <button
              disabled={pending}
              className="flex-1 cursor-pointer rounded-lg bg-bad px-4 py-3 text-sm font-bold text-ink disabled:opacity-50"
            >
              {pending ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
          </div>
        </form>
      </ConfirmDialog>
    </section>
  );
}
