"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { publishProgramAction } from "../editar/actions";

export function PublishControls({
  slug,
  published,
  ready,
  enabled,
}: {
  slug: string;
  published: boolean;
  ready: boolean;
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(
    publishProgramAction.bind(null, slug),
    {},
  );
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mt-6">
      {!enabled && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-line bg-surface-2 p-4 text-sm text-muted"
        >
          La publicación estará disponible en breve. Puedes seguir preparando tu
          programa.
        </p>
      )}
      {state.ok && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-good/30 bg-good/10 p-4 text-sm text-good"
        >
          {state.ok}
        </p>
      )}
      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-bad/30 bg-bad/10 p-4 text-sm text-bad"
        >
          {state.error}
        </p>
      )}
      {published ? (
        <>
          <Link
            href={`/programa/${slug}`}
            className="block rounded-xl bg-accent px-5 py-3.5 text-center font-bold text-accent-ink"
          >
            Ver programa publicado →
          </Link>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm font-semibold">¿Necesitas hacer una pausa?</p>
            <p className="mt-1 text-sm text-muted">
              Retíralo del catálogo para dejar de recibir nuevas inscripciones.
              Tus alumnos conservan sus clases y su progreso.
            </p>
            {!confirm ? (
              <button
                type="button"
                disabled={!enabled}
                onClick={() => setConfirm(true)}
                className="mt-3 cursor-pointer rounded-lg border border-line px-4 py-2.5 text-sm font-semibold hover:border-fg/30"
              >
                Retirar del catálogo
              </button>
            ) : (
              <form
                action={action}
                className="mt-3 rounded-xl border border-line bg-surface-2 p-4"
              >
                <input type="hidden" name="intent" value="withdraw" />
                <p className="text-sm">
                  Dejará de aparecer en búsquedas y recomendaciones. Podrás
                  volver a publicarlo desde aquí.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    disabled={pending}
                    className="cursor-pointer rounded-lg bg-fg px-4 py-2.5 text-sm font-bold text-ink disabled:opacity-50"
                  >
                    {pending ? "Retirando…" : "Sí, retirar del catálogo"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirm(false)}
                    className="cursor-pointer rounded-lg px-4 py-2.5 text-sm text-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      ) : (
        <form
          action={(fd) => {
            setConfirm(false);
            action(fd);
          }}
        >
          <input type="hidden" name="intent" value="publish" />
          <button
            disabled={!ready || !enabled || pending}
            className="w-full cursor-pointer rounded-xl bg-accent px-5 py-3.5 font-bold text-accent-ink transition hover:brightness-110 disabled:cursor-default disabled:opacity-40"
          >
            {pending ? "Publicando…" : "Publicar programa"}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            {ready
              ? "Aparecerá en el catálogo y podrá recibir alumnos."
              : "Completa los pasos pendientes para habilitar la publicación."}
          </p>
        </form>
      )}
    </div>
  );
}
