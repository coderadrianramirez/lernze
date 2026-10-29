"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setDoneAction } from "./actions";

type Props = {
  slug: string;
  lessonId: string;
  src: string | null;
  done: boolean;
  canTrack: boolean;
  nextHref: string | null;
  prevHref: string | null;
};

/** Reproductor de la clase: al terminar la marca como completada y ofrece la siguiente. */
export function LessonPlayer({ slug, lessonId, src, done, canTrack, nextHref, prevHref }: Props) {
  const router = useRouter();
  const [isDone, setIsDone] = useState(done);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const save = (value: boolean) =>
    start(async () => {
      setError("");
      const prev = isDone;
      setIsDone(value);
      const r = await setDoneAction(slug, lessonId, value);
      if (r.error) {
        setIsDone(prev);
        setError(r.error);
      }
      router.refresh();
    });

  return (
    <div>
      <div className="relative -mx-4 bg-black md:mx-0 md:overflow-hidden md:rounded-2xl">
        {src ? (
          <video
            key={src}
            src={src}
            controls
            playsInline
            autoPlay
            preload="metadata"
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            onEnded={() => {
              setEnded(true);
              if (canTrack && !isDone) save(true);
            }}
            onPlay={() => setEnded(false)}
            className="aspect-video w-full"
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="font-semibold">Esta clase todavía no tiene video</p>
            <p className="text-sm text-muted">El creador lo está preparando.</p>
          </div>
        )}

        {ended && nextHref && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 px-6 text-center backdrop-blur-sm">
            <p className="font-display text-xl font-bold">¡Clase terminada!</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEnded(false)} className="cursor-pointer rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold">
                Ver de nuevo
              </button>
              <Link href={nextHref} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink">
                Siguiente clase →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canTrack && (
          <button
            type="button"
            disabled={pending}
            onClick={() => save(!isDone)}
            aria-pressed={isDone}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              isDone ? "bg-good/15 text-good" : "border border-line text-fg hover:border-fg/30"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isDone ? "Completada" : "Marcar como completada"}
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {prevHref && (
            <Link href={prevHref} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:border-fg/30" aria-label="Clase anterior">
              ←
            </Link>
          )}
          {nextHref && (
            <Link href={nextHref} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink">
              Siguiente →
            </Link>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-[13px] text-bad">{error}</p>}
    </div>
  );
}
