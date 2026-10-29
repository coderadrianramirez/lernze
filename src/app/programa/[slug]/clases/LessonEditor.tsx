"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { VideoUpload, type UploadedVideo } from "@/components/VideoUpload";
import type { Lesson } from "@/lib/types";
import {
  addLessonAction,
  deleteLessonAction,
  moveLessonAction,
  updateLessonAction,
  type LessonFormState,
} from "./actions";

const field =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Campos compartidos entre "nueva clase" y "editar clase". */
function LessonFields({
  courseId,
  lesson,
  video,
  setVideo,
}: {
  courseId: string;
  lesson?: Lesson;
  video: UploadedVideo | null;
  setVideo: (v: UploadedVideo | null) => void;
}) {
  const id = lesson?.id ?? "new";
  return (
    <div className="grid gap-4">
      <div>
        <label htmlFor={`t-${id}`} className="mb-1.5 block text-sm font-medium">Título de la clase</label>
        <input id={`t-${id}`} name="title" required minLength={2} maxLength={120} defaultValue={lesson?.title} className={field} placeholder="Ej. Cómo elegir tu primer producto" />
      </div>
      <div>
        <label htmlFor={`d-${id}`} className="mb-1.5 block text-sm font-medium">Descripción (opcional)</label>
        <textarea id={`d-${id}`} name="description" rows={3} maxLength={2000} defaultValue={lesson?.description} className={field} placeholder="Qué se ve en esta clase." />
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium">Video</p>
        {lesson?.videoPath && !video ? (
          <p className="mb-2 text-[13px] text-muted">Esta clase ya tiene video. Sube otro solo si quieres reemplazarlo.</p>
        ) : null}
        <VideoUpload kind="lesson" courseId={courseId} maxSeconds={60 * 60} label="Sube el video de la clase" value={video} onChange={setVideo} />
        <input type="hidden" name="videoPath" value={video?.path ?? lesson?.videoPath ?? ""} />
        <input type="hidden" name="durationSeconds" value={video?.seconds ?? lesson?.durationSeconds ?? 0} />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3.5">
        <input type="checkbox" name="isPreview" defaultChecked={lesson?.isPreview} className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />
        <span>
          <span className="block text-sm font-medium">Vista previa gratis</span>
          <span className="block text-[13px] text-muted">Cualquiera puede verla antes de unirse. Ideal para la primera clase.</span>
        </span>
      </label>
    </div>
  );
}

function NewLesson({ slug, courseId, first }: { slug: string; courseId: string; first: boolean }) {
  const [state, action, pending] = useActionState<LessonFormState, FormData>(addLessonAction.bind(null, slug), {});
  const [open, setOpen] = useState(first);
  // La clave cambia al guardar con éxito: el formulario y su video se vacían solos.
  return (
    <NewLessonForm
      key={state.key ?? 0}
      courseId={courseId}
      first={first}
      open={open}
      setOpen={setOpen}
      action={action}
      pending={pending}
      error={state.error}
    />
  );
}

function NewLessonForm({
  courseId,
  first,
  open,
  setOpen,
  action,
  pending,
  error,
}: {
  courseId: string;
  first: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  action: (fd: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const [video, setVideo] = useState<UploadedVideo | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-5 font-semibold text-accent transition-colors hover:border-accent/60"
      >
        + Agregar clase
      </button>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="mb-4 font-display text-lg font-bold">{first ? "Tu primera clase" : "Nueva clase"}</h2>
      <LessonFields courseId={courseId} video={video} setVideo={setVideo} />
      {error && <p role="alert" className="mt-3 text-[13px] text-bad">{error}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button disabled={pending} className="cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar clase"}
        </button>
        {!first && (
          <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-xl px-5 py-3 text-sm text-muted hover:text-fg">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function LessonRow({ slug, courseId, lesson, index, total }: { slug: string; courseId: string; lesson: Lesson; index: number; total: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<LessonFormState | void>, after?: () => void) =>
    start(async () => {
      setError("");
      const r = await fn();
      if (r && r.error) setError(r.error);
      else after?.();
      router.refresh();
    });

  const iconBtn =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-default disabled:opacity-30";

  return (
    <li className={`rounded-2xl border border-line bg-surface ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display font-bold">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{lesson.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            {lesson.videoPath ? <span>{clock(lesson.durationSeconds)}</span> : <span className="text-bad">Sin video</span>}
            {lesson.isPreview && <span className="rounded-full bg-ai/15 px-2 py-0.5 font-semibold text-ai">Vista previa</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <button type="button" aria-label="Subir" disabled={index === 0 || pending} onClick={() => run(() => moveLessonAction(slug, lesson.id, -1))} className={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m18 15-6-6-6 6" /></svg>
          </button>
          <button type="button" aria-label="Bajar" disabled={index === total - 1 || pending} onClick={() => run(() => moveLessonAction(slug, lesson.id, 1))} className={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <button type="button" aria-label="Editar" aria-expanded={editing} onClick={() => setEditing((v) => !v)} className={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
          </button>
        </div>
      </div>

      {editing && (
        <form
          action={(fd) =>
            run(
              () => updateLessonAction(slug, lesson.id, fd),
              () => {
                setEditing(false);
                setVideo(null);
              },
            )
          }
          className="border-t border-line p-4 sm:p-5"
        >
          <LessonFields courseId={courseId} lesson={lesson} video={video} setVideo={setVideo} />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button disabled={pending} className="cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink disabled:opacity-60">
              Guardar cambios
            </button>
            <button type="button" onClick={() => setEditing(false)} className="cursor-pointer rounded-xl px-4 py-3 text-sm text-muted hover:text-fg">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Borrar la clase “${lesson.title}”? También se borra su video.`)) run(() => deleteLessonAction(slug, lesson.id));
              }}
              className="ml-auto cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-bad hover:bg-bad/10"
            >
              Borrar clase
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="px-4 pb-3 text-[13px] text-bad">{error}</p>}
    </li>
  );
}

export function LessonEditor({ slug, courseId, lessons }: { slug: string; courseId: string; lessons: Lesson[] }) {
  return (
    <div className="grid gap-3">
      {lessons.length > 0 && (
        <ol className="grid gap-3">
          {lessons.map((l, i) => (
            <LessonRow key={l.id} slug={slug} courseId={courseId} lesson={l} index={i} total={lessons.length} />
          ))}
        </ol>
      )}
      <NewLesson slug={slug} courseId={courseId} first={lessons.length === 0} />
    </div>
  );
}
