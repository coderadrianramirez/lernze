"use client";

import { useActionState, useState } from "react";
import { VideoUpload, type UploadedVideo } from "@/components/VideoUpload";
import { NOUN } from "@/lib/copy";
import { CATEGORIES } from "@/lib/types";
import { createCourseAction, type CreateState } from "./actions";

const initial: CreateState = { errors: {} };

const field =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none aria-[invalid=true]:border-bad";

export function CreateCourseForm({ defaultName, canUpload }: { defaultName: string; canUpload: boolean }) {
  const [state, action, pending] = useActionState(createCourseAction, initial);
  const [trailer, setTrailer] = useState<UploadedVideo | null>(null);
  const [useLink, setUseLink] = useState(!canUpload);
  const e = state.errors;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Título del {NOUN.one}</label>
        <input id="title" name="title" className={field} aria-invalid={!!e.title} aria-describedby="title-err" placeholder="Ej. Abre tu negocio online desde cero" />
        <p id="title-err" className="mt-1 text-[13px] text-bad">{e.title}</p>
      </div>

      <div>
        <label htmlFor="creatorName" className="mb-1.5 block text-sm font-medium">Tu nombre público</label>
        <input id="creatorName" name="creatorName" defaultValue={defaultName} autoComplete="name" className={field} aria-invalid={!!e.creatorName} aria-describedby="creator-err" />
        <p id="creator-err" className="mt-1 text-[13px] text-bad">{e.creatorName}</p>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Descripción</label>
        <textarea id="description" name="description" rows={4} maxLength={2000} className={field} placeholder="Qué aprenderá la gente y para quién es." />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium">Categoría</label>
          <select id="category" name="category" defaultValue="" className={field} aria-invalid={!!e.category} aria-describedby="cat-err">
            <option value="" disabled>Elige una</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p id="cat-err" className="mt-1 text-[13px] text-bad">{e.category}</p>
        </div>
        <div>
          <label htmlFor="price" className="mb-1.5 block text-sm font-medium">Precio en dólares</label>
          <input id="price" name="price" inputMode="decimal" className={field} aria-invalid={!!e.price} aria-describedby="price-err" placeholder="49" />
          <p id="price-err" className="mt-1 text-[13px] text-bad">{e.price}</p>
        </div>
      </div>

      <fieldset className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <legend className="px-1 text-sm font-medium">Trailer</legend>
        <p className="mb-4 text-[13px] text-muted">
          {`Un video corto (hasta 3 minutos) que cuente qué aprende quien entra a tu ${NOUN.one}. Es lo que se ve en el Discover.`}
        </p>

        {useLink ? (
          <div>
            <label htmlFor="trailerUrl" className="mb-1.5 block text-sm">Enlace al video</label>
            <input id="trailerUrl" name="trailerUrl" className={field} aria-invalid={!!e.trailerUrl} aria-describedby="trailer-err" placeholder="https://" />
          </div>
        ) : (
          <>
            <VideoUpload kind="trailer" maxSeconds={180} label="Sube tu trailer" value={trailer} onChange={setTrailer} />
            <input type="hidden" name="trailerUrl" value={trailer?.url ?? ""} />
            <input type="hidden" name="trailerSeconds" value={trailer?.seconds ?? 0} />
          </>
        )}
        <p id="trailer-err" className="mt-1 text-[13px] text-bad">{e.trailerUrl}</p>

        {canUpload && (
          <button type="button" onClick={() => setUseLink((v) => !v)} className="mt-2 cursor-pointer text-[13px] font-semibold text-accent">
            {useLink ? "Prefiero subir el video" : "Prefiero pegar un enlace"}
          </button>
        )}
        <p className="mt-3 text-[13px] text-muted">
          {`¿Todavía no lo tienes? Déjalo vacío: tu ${NOUN.one} sale con un trailer animado hecho con tu título y descripción, y puedes cambiarlo después.`}
        </p>
      </fieldset>

      <button
        disabled={pending}
        className="w-full cursor-pointer rounded-xl bg-accent px-5 py-3.5 font-bold text-accent-ink disabled:cursor-default disabled:opacity-60 sm:w-auto sm:justify-self-start"
      >
        {pending ? "Publicando…" : `Publicar ${NOUN.one}`}
      </button>
    </form>
  );
}
