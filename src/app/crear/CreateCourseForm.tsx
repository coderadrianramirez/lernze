"use client";

import { useActionState } from "react";
import { createCourseAction, type CreateState } from "./actions";
import { NOUN } from "@/lib/copy";
import { CATEGORIES } from "@/lib/types";

const initial: CreateState = { errors: {} };

const field =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg placeholder:text-muted/70 aria-[invalid=true]:border-bad";

export function CreateCourseForm() {
  const [state, action, pending] = useActionState(createCourseAction, initial);
  const e = state.errors;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm">Título del {NOUN.one}</label>
        <input id="title" name="title" className={field} aria-invalid={!!e.title} aria-describedby="title-err" placeholder="Ej. Abre tu negocio online desde cero" />
        <p id="title-err" className="mt-1 text-[13px] text-bad">{e.title}</p>
      </div>

      <div>
        <label htmlFor="creatorName" className="mb-1.5 block text-sm">Tu nombre público</label>
        <input id="creatorName" name="creatorName" className={field} aria-invalid={!!e.creatorName} aria-describedby="creator-err" />
        <p id="creator-err" className="mt-1 text-[13px] text-bad">{e.creatorName}</p>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm">Descripción</label>
        <textarea id="description" name="description" rows={4} className={field} placeholder="Qué aprenderá la gente y para quién es." />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm">Categoría</label>
          <select id="category" name="category" defaultValue="" className={field} aria-invalid={!!e.category} aria-describedby="cat-err">
            <option value="" disabled>Elige una</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p id="cat-err" className="mt-1 text-[13px] text-bad">{e.category}</p>
        </div>
        <div>
          <label htmlFor="price" className="mb-1.5 block text-sm">Precio en dólares</label>
          <input id="price" name="price" inputMode="decimal" className={field} aria-invalid={!!e.price} aria-describedby="price-err" placeholder="149" />
          <p id="price-err" className="mt-1 text-[13px] text-bad">{e.price}</p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <label htmlFor="trailerUrl" className="mb-1.5 block text-sm">Enlace a tu trailer (opcional)</label>
        <input id="trailerUrl" name="trailerUrl" className={field} aria-invalid={!!e.trailerUrl} aria-describedby="trailer-err" placeholder="https://" />
        <p id="trailer-err" className="mt-1 text-[13px] text-bad">{e.trailerUrl}</p>
        <p className="mt-2 text-[13px] text-muted">
          Si lo dejas vacío, Lernze generará un trailer con IA a partir de tu temario y te lo mostrará para aprobar. Esa
          parte aún está en construcción: por ahora el {NOUN.one} sale con la etiqueta de trailer IA.
        </p>
      </div>

      <div>
        <button
          disabled={pending}
          className="cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink disabled:cursor-default disabled:opacity-60"
        >
          {pending ? "Publicando..." : `Publicar ${NOUN.one}`}
        </button>
      </div>
    </form>
  );
}
