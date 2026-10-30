"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { VideoUpload, type UploadedVideo } from "@/components/VideoUpload";
import { CoverEditor } from "@/components/CoverEditor";
import { LessonCover } from "@/components/LessonCover";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { discardMediaAction } from "@/app/actions/media";
import type { ArtConfig, CoverConfig, Lesson } from "@/lib/types";
import type { MediaAsset } from "@/lib/media-management";
import {
  addLessonAction,
  deleteLessonAction,
  moveLessonAction,
  updateLessonAction,
  previewLessonVideoAction,
} from "./actions";

type Context = {
  slug: string;
  courseId: string;
  contentReady: boolean;
  art: ArtConfig;
  published: boolean;
};
const field =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none";
const button =
  "cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink disabled:opacity-50";

function LessonForm({
  lesson,
  onClose,
  ...context
}: Context & { lesson?: Lesson; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [isPreview, setIsPreview] = useState(lesson?.isPreview ?? false);
  const [cover, setCover] = useState<CoverConfig | null>(lesson?.cover ?? null);
  const [video, setVideo] = useState<UploadedVideo | null>(
    lesson?.videoPath
      ? {
          path: lesson.videoPath,
          url: null,
          seconds: lesson.durationSeconds,
          name: "Video actual",
        }
      : null,
  );
  const [uploading, setUploading] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [dirty, setDirty] = useState(false);
  const assets = useRef<MediaAsset[]>([]);
  const busy = pending || uploading || coverBusy;
  const id = lesson?.id ?? "new";

  function cancel() {
    start(async () => {
      const result = await discardMediaAction(assets.current);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <form
      noValidate
      onChange={() => setDirty(true)}
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        fd.set("draftAssets", JSON.stringify(assets.current));
        start(async () => {
          setError("");
          const result = lesson
            ? await updateLessonAction(context.slug, lesson.id, fd)
            : await addLessonAction(context.slug, {}, fd);
          if (result.error) setError(result.error);
          else {
            onClose();
            router.refresh();
          }
        });
      }}
      className="grid min-w-0 gap-4 border-t border-line p-4 sm:p-5"
    >
      <h3 className="font-display text-lg font-bold">
        {lesson ? "Editar clase" : "Nueva clase"}
      </h3>
      {context.published && (
        <p className="text-sm text-muted">
          Los cambios guardados se mostrarán a tus alumnos. Para dejar una clase
          sin video o eliminar la última, retira primero el programa del
          catálogo.
        </p>
      )}
      <label className="text-sm font-medium" htmlFor={"title-" + id}>
        Título de la clase
        <input
          id={"title-" + id}
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className={field + " mt-1.5"}
          placeholder="Ej. Tu primer proyecto"
        />
      </label>
      <label className="text-sm font-medium" htmlFor={"desc-" + id}>
        Descripción (opcional)
        <textarea
          id={"desc-" + id}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          className={field + " mt-1.5"}
        />
      </label>
      <div>
        <p className="mb-2 text-sm font-medium">Video de la clase</p>
        <VideoUpload
          kind="lesson"
          courseId={context.courseId}
          maxSeconds={3600}
          value={video}
          onChange={(value) => {
            if (value?.path)
              assets.current.push({ bucket: "lessons", path: value.path });
            setVideo(value);
            setDirty(true);
          }}
          onUploadingChange={setUploading}
          label="Sube el video de la clase"
        />
        {lesson?.videoPath &&
          video?.path === lesson.videoPath &&
          !video.url && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                start(async () => {
                  const result = await previewLessonVideoAction(
                    context.slug,
                    lesson.id,
                  );
                  if (result.error) setError(result.error);
                  else if (result.url)
                    setVideo((old) =>
                      old ? { ...old, url: result.url! } : old,
                    );
                })
              }
              className="mt-2 cursor-pointer text-sm font-semibold text-accent disabled:opacity-50"
            >
              Previsualizar video y elegir fotograma
            </button>
          )}
        <input type="hidden" name="videoPath" value={video?.path ?? ""} />
        <input
          type="hidden"
          name="durationSeconds"
          value={video?.seconds ?? 0}
        />
      </div>
      {context.contentReady ? <CoverEditor
        title={title}
        art={context.art}
        courseId={context.courseId}
        value={cover}
        onChange={(value) => {
          setCover(value);
          setDirty(true);
        }}
        onBusyChange={setCoverBusy}
        onAsset={(asset) => assets.current.push(asset)}
        videoUrl={video?.previewUrl ?? video?.url}
        enabled={context.contentReady}
        disabled={pending || uploading}
      /> : <LessonCover lesson={{id, title:title || "Tu clase",cover:null}} art={context.art} />}
      {context.contentReady && (
        <input type="hidden" name="cover" value={JSON.stringify(cover)} />
      )}
      {!context.contentReady && (
        <p className="text-xs text-muted">
          La personalización de portadas de clases estará disponible en breve.
        </p>
      )}
      <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
        <input
          type="checkbox"
          name="isPreview"
          checked={isPreview}
          onChange={(e) => setIsPreview(e.target.checked)}
          className="mt-1 accent-accent"
        />
        <span>
          Vista previa gratis
          <span className="mt-1 block text-xs text-muted">
            Cualquiera podrá ver esta clase cuando publiques el programa.
          </span>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className={button}>
          {pending ? "Guardando…" : "Guardar clase"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            dirty || assets.current.length ? setConfirm("cancel") : cancel()
          }
          className="cursor-pointer rounded-xl border border-line px-4 py-3 text-sm"
        >
          Cancelar
        </button>
        {lesson && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirm("delete")}
            className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-bad sm:ml-auto"
          >
            Eliminar clase
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        busy={pending}
        title={
          confirm === "delete"
            ? "¿Eliminar esta clase?"
            : "¿Descartar los cambios?"
        }
      >
        <p className="text-sm text-muted">
          {confirm === "delete"
            ? `Se eliminarán “${lesson?.title}”, su video, su portada y el progreso de tus alumnos en esta clase. Esta acción es permanente.`
            : "Se descartarán los cambios y las subidas sin guardar."}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-bad">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className={button}
            onClick={() => {
              if (confirm !== "delete" || !lesson) {
                cancel();
                return;
              }
              start(async () => {
                setError("");
                const result = await deleteLessonAction(
                  context.slug,
                  lesson.id,
                );
                if (result.error) setError(result.error);
                else {
                  await discardMediaAction(assets.current);
                  onClose();
                  router.refresh();
                }
              });
            }}
          >
            {pending
              ? "Procesando…"
              : confirm === "delete"
                ? "Eliminar definitivamente"
                : "Descartar cambios"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm(null)}
            className="rounded-xl border border-line px-4 py-3"
          >
            Volver
          </button>
        </div>
      </ConfirmDialog>
    </form>
  );
}

function LessonRow({
  lesson,
  index,
  total,
  ...context
}: Context & { lesson: Lesson; index: number; total: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  function move(direction: -1 | 1) {
    start(async () => {
      const result = await moveLessonAction(context.slug, lesson.id, direction);
      setError(result?.error ?? "");
      router.refresh();
    });
  }
  return (
    <li className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
        <span className="text-sm font-bold text-muted">{index + 1}</span>
        <div className="hidden w-24 shrink-0 overflow-hidden rounded-lg sm:block">
          <LessonCover lesson={lesson} art={context.art} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{lesson.title}</p>
          <p className="mt-1 text-xs text-muted">
            {lesson.videoPath
              ? `${Math.floor(lesson.durationSeconds / 60)}:${String(lesson.durationSeconds % 60).padStart(2, "0")}`
              : "Sin video"}
            {lesson.isPreview ? " · Vista previa" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Subir clase"
            disabled={pending || editing || index === 0}
            onClick={() => move(-1)}
            className="h-10 w-8 cursor-pointer rounded-lg disabled:opacity-25"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Bajar clase"
            disabled={pending || editing || index === total - 1}
            onClick={() => move(1)}
            className="h-10 w-8 cursor-pointer rounded-lg disabled:opacity-25"
          >
            ↓
          </button>
          <button
            type="button"
            aria-expanded={editing}
            disabled={editing}
            onClick={() => setEditing(true)}
            className="cursor-pointer rounded-lg px-2 py-3 text-xs font-semibold text-accent disabled:opacity-50"
          >
            Editar
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="px-4 pb-3 text-sm text-bad">
          {error}
        </p>
      )}
      {editing && (
        <LessonForm
          {...context}
          lesson={lesson}
          onClose={() => setEditing(false)}
        />
      )}
    </li>
  );
}

export function LessonEditor({
  lessons,
  ...context
}: Context & { lessons: Lesson[] }) {
  const [adding, setAdding] = useState(lessons.length === 0);
  return (
    <div className="grid gap-3">
      {lessons.length > 0 && (
        <ol className="grid gap-3">
          {lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              {...context}
              lesson={lesson}
              index={index}
              total={lessons.length}
            />
          ))}
        </ol>
      )}
      {adding ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <LessonForm {...context} onClose={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-line py-5 font-semibold text-accent"
        >
          + Agregar clase
        </button>
      )}
    </div>
  );
}
