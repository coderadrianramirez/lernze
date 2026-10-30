"use client";

import { startTransition, useActionState, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CoverEditor } from "@/components/CoverEditor";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { discardMediaAction } from "@/app/actions/media";
import type { MediaAsset } from "@/lib/media-management";
import type { CoverConfig, Category } from "@/lib/types";
import { VideoUpload, type UploadedVideo } from "@/components/VideoUpload";
import { NOUN } from "@/lib/copy";
import { CATEGORIES } from "@/lib/types";
import { createCourseAction } from "./actions";
import { updateProgramAction } from "@/app/programa/[slug]/editar/actions";
import type { ProgramFormState } from "@/lib/program-validation";
import type { Course } from "@/lib/types";

const initial: ProgramFormState = { errors: {} };

const field =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none aria-[invalid=true]:border-bad";

export function CreateCourseForm({
  defaultName,
  canUpload,
  course,
  contentReady = false,
}: {
  defaultName: string;
  canUpload: boolean;
  course?: Course;
  contentReady?: boolean;
}) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const assets = useRef<MediaAsset[]>([]);
  const [cover, setCover] = useState<CoverConfig | null>(
    course?.art.cover ?? null,
  );
  const [coverBusy, setCoverBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [cancelError, setCancelError] = useState("");
  async function cancel() {
    setLeaving(true);
    setCancelError("");
    const result = assets.current.length
      ? await discardMediaAction(assets.current)
      : {};
    if (result.error) {
      setCancelError(result.error);
      setLeaving(false);
      return;
    }
    router.push("/dashboard?vista=ensenar");
  }
  const [state, action, pending] = useActionState(
    async (previous: ProgramFormState, form: FormData) => {
      const result = course
        ? await updateProgramAction(course.slug, previous, form)
        : await createCourseAction(previous, form);
      if (result.saved) setDirty(false);
      return result;
    },
    initial,
  );
  const [trailer, setTrailer] = useState<UploadedVideo | null>(
    course?.trailerUrl
      ? {
          path: "",
          url: course.trailerUrl,
          seconds: course.trailerSeconds,
          name: "Trailer actual",
        }
      : null,
  );
  const [link, setLink] = useState(course?.trailerUrl ?? "");
  const [useLink, setUseLink] = useState(!canUpload);
  const [uploading, setUploading] = useState(false);

  const [values, setValues] = useState({
    title: course?.title ?? "",
    description: course?.description ?? "",
    creatorName: defaultName,
    category: course?.category ?? "",
    price: course ? String(course.priceCents / 100) : "",
  });
  const update = (key: keyof typeof values, value: string) =>
    setValues((old) => ({ ...old, [key]: value }));
  const e = state.errors;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(
          event.currentTarget,
          (event.nativeEvent as SubmitEvent).submitter,
        );
        fd.set("draftAssets", JSON.stringify(assets.current));
        startTransition(() => action(fd));
      }}
      onChange={() => setDirty(true)}
      className="grid gap-5"
      noValidate
    >
      <input type="hidden" name="cover" value={JSON.stringify(cover)} />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={pending || uploading || coverBusy}
          onClick={() =>
            dirty || assets.current.length ? setCancelOpen(true) : void cancel()
          }
          className="cursor-pointer rounded-lg border border-line px-4 py-2 text-sm text-muted"
        >
          Cancelar
        </button>
      </div>
      <ConfirmDialog
        open={cancelOpen}
        title={course ? "¿Descartar los cambios?" : "¿Cancelar la creación?"}
        onClose={() => setCancelOpen(false)}
        busy={leaving}
      >
        <p className="text-sm text-muted">
          {course
            ? "Tu programa conservará la última versión guardada. Se descartarán los cambios y las subidas sin guardar."
            : "Se descartarán los datos y archivos de este formulario. No se creará ningún programa."}
        </p>
        {cancelError && (
          <p role="alert" className="mt-3 text-sm text-bad">
            {cancelError}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={leaving}
            onClick={() => void cancel()}
            className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink"
          >
            {leaving ? "Descartando…" : "Descartar y salir"}
          </button>
          <button
            type="button"
            disabled={leaving}
            onClick={() => setCancelOpen(false)}
            className="rounded-xl border border-line px-4 py-3"
          >
            Seguir editando
          </button>
        </div>
      </ConfirmDialog>
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
          Título del {NOUN.one}
        </label>
        <input
          id="title"
          name="title"
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={120}
          className={field}
          aria-invalid={!!e.title}
          aria-describedby="title-err"
          placeholder="Ej. Abre tu negocio online desde cero"
        />
        <p id="title-err" className="mt-1 text-[13px] text-bad">
          {e.title}
        </p>
      </div>

      <div>
        <label
          htmlFor="creatorName"
          className="mb-1.5 block text-sm font-medium"
        >
          Tu nombre público
        </label>
        <input
          id="creatorName"
          name="creatorName"
          maxLength={120}
          value={values.creatorName}
          onChange={(e) => update("creatorName", e.target.value)}
          autoComplete="name"
          className={field}
          aria-invalid={!!e.creatorName}
          aria-describedby="creator-err"
        />
        <p id="creator-err" className="mt-1 text-[13px] text-bad">
          {e.creatorName}
        </p>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium"
        >
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          aria-invalid={!!e.description}
          aria-describedby="description-err"
          className={field}
          placeholder="Qué aprenderá la gente y para quién es."
        />
      </div>

      <p id="description-err" className="-mt-4 text-[13px] text-bad">
        {e.description}
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="category"
            className="mb-1.5 block text-sm font-medium"
          >
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={(e) => update("category", e.target.value)}
            className={field}
            aria-invalid={!!e.category}
            aria-describedby="cat-err"
          >
            <option value="" disabled>
              Elige una
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p id="cat-err" className="mt-1 text-[13px] text-bad">
            {e.category}
          </p>
        </div>
        <div>
          <label htmlFor="price" className="mb-1.5 block text-sm font-medium">
            Precio en dólares
          </label>
          <input
            id="price"
            name="price"
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
            inputMode="decimal"
            className={field}
            aria-invalid={!!e.price}
            aria-describedby="price-err"
            placeholder="49"
          />
          <p id="price-err" className="mt-1 text-[13px] text-bad">
            {e.price}
          </p>
        </div>
      </div>

      <fieldset className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <legend className="px-1 text-sm font-medium">Trailer</legend>
        <p className="mb-4 text-[13px] text-muted">
          {`Un video corto (hasta 3 minutos) que cuente qué aprende quien entra a tu ${NOUN.one}. Es lo que se ve en el Discover.`}
        </p>

        {useLink ? (
          <div>
            <label htmlFor="trailerUrl" className="mb-1.5 block text-sm">
              Enlace al video
            </label>
            <input
              id="trailerUrl"
              name="trailerUrl"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className={field}
              aria-invalid={!!e.trailerUrl}
              aria-describedby="trailer-err"
              placeholder="https://"
            />
          </div>
        ) : (
          <>
            <VideoUpload
              kind="trailer"
              maxSeconds={180}
              label="Sube tu trailer"
              value={trailer}
              onUploadingChange={setUploading}
              onChange={(v) => {
                if (v?.path)
                  assets.current.push({ bucket: "trailers", path: v.path });
                setTrailer(v);
                setDirty(true);
              }}
            />
            <input type="hidden" name="trailerUrl" value={trailer?.url ?? ""} />
            <input
              type="hidden"
              name="trailerSeconds"
              value={trailer?.seconds ?? 0}
            />
          </>
        )}
        <p id="trailer-err" className="mt-1 text-[13px] text-bad">
          {e.trailerUrl}
        </p>

        {canUpload && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (useLink)
                setTrailer(
                  link
                    ? {
                        path: "",
                        url: link,
                        seconds: 0,
                        name: "Trailer actual",
                      }
                    : null,
                );
              else setLink(trailer?.url ?? "");
              setUseLink((v) => !v);
            }}
            className="mt-2 cursor-pointer text-[13px] font-semibold text-accent"
          >
            {useLink ? "Prefiero subir el video" : "Prefiero pegar un enlace"}
          </button>
        )}
        <p className="mt-3 text-[13px] text-muted">
          {`Es opcional: si lo dejas vacío, usaremos un trailer animado con tu título y descripción. Puedes cambiarlo desde aquí.`}
        </p>
      </fieldset>

      <CoverEditor
        title={values.title}
        category={(values.category as Category) || undefined}
        art={course?.art}
        courseId={course?.id}
        value={cover}
        onChange={(value) => {
          setCover(value);
          setDirty(true);
        }}
        onAsset={(asset) => assets.current.push(asset)}
        onBusyChange={setCoverBusy}
        videoUrl={useLink ? link : (trailer?.previewUrl ?? trailer?.url)}
        enabled={contentReady}
        disabled={pending || uploading || coverBusy}
      />
      {e.cover && (
        <p role="alert" className="text-sm text-bad">
          {e.cover}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-bad">
          {state.error}
        </p>
      )}
      {state.saved && !dirty && (
        <p role="status" className="text-sm text-good">
          Cambios guardados.
        </p>
      )}
      <button
        disabled={pending || uploading || coverBusy}
        className="w-full cursor-pointer rounded-xl bg-accent px-5 py-3.5 font-bold text-accent-ink disabled:cursor-default disabled:opacity-60 sm:w-auto sm:justify-self-start"
      >
        {uploading
          ? "Espera a que termine la subida…"
          : pending
            ? "Guardando…"
            : course
              ? "Guardar cambios"
              : "Guardar borrador y continuar →"}
      </button>
      {course && (
        <button
          name="next"
          value="classes"
          disabled={pending || uploading || coverBusy}
          className="cursor-pointer rounded-xl border border-line px-5 py-3 text-center text-sm font-semibold disabled:opacity-50 sm:justify-self-start"
        >
          Guardar y continuar a clases →
        </button>
      )}
      {!course && (
        <p className="text-xs text-muted">
          Solo tú podrás verlo hasta que decidas publicarlo.
        </p>
      )}
    </form>
  );
}
