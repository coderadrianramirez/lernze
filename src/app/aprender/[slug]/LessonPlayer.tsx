"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { resumePosition, type PlaybackPosition } from "@/lib/playback";
import { renewLessonVideoAction, savePlaybackAction, setDoneAction } from "./actions";

type Props = {
  poster: ReactNode;
  slug: string;
  lessonId: string;
  src: string | null;
  videoPath: string | null;
  playback: PlaybackPosition | null;
  userId?: string;
  done: boolean;
  canTrack: boolean;
  nextHref: string | null;
  prevHref: string | null;
};

export function LessonPlayer({ poster, slug, lessonId, src, videoPath, playback, userId, done, canTrack, nextHref, prevHref }: Props) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const position = useRef(0);
  const lastLocal = useRef(-1);
  const lastSync = useRef(-10);
  const startedRef = useRef(false);
  const retryPosition = useRef<number | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);
  const [started, setStarted] = useState(false);
  const [source, setSource] = useState(src);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(Boolean(videoPath && !src));
  const [retrying, setRetrying] = useState(false);
  const [isDone, setIsDone] = useState(done);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");
  const [pending, start] = useTransition();
  const storageKey = userId ? `lernze:playback:${userId}:${lessonId}` : null;

  const remember = useCallback((seconds: number, sync: boolean) => {
    if (!canTrack || !storageKey || !videoPath || !Number.isFinite(seconds)) return;
    const value = Math.max(0, Math.floor(seconds));
    const entry: PlaybackPosition = { seconds: value, updatedAt: new Date().toISOString(), videoPath };
    try { localStorage.setItem(storageKey, JSON.stringify(entry)); } catch { /* La cuenta todavía puede sincronizar el punto. */ }
    lastLocal.current = value;
    if (!sync || value === lastSync.current) return;
    lastSync.current = value;
    queue.current = queue.current.catch(() => {}).then(async () => {
      try {
        const result = await savePlaybackAction(slug, lessonId, value);
        if (mounted.current) setSyncNotice(result.error ?? "");
      } catch {
        if (mounted.current) setSyncNotice("Tu punto está guardado en este navegador. Lo sincronizaremos cuando vuelvas a reproducir con conexión.");
      }
    });
  }, [canTrack, storageKey, videoPath, slug, lessonId]);

  useEffect(() => {
    mounted.current = true;
    const current = video.current;
    const hide = () => { if (document.visibilityState === "hidden" && startedRef.current) remember(position.current, true); };
    document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", hide);
      if (current) { current.pause(); remember(position.current, true); }
    };
  }, [remember, started, attempt, failed]);

  const save = (value: boolean) => start(async () => {
    setError("");
    const previous = isDone;
    setIsDone(value);
    try {
      const result = await setDoneAction(slug, lessonId, value);
      if (result.error) { setIsDone(previous); setError(result.error); }
      else router.refresh();
    } catch {
      setIsDone(previous);
      setError("No pudimos guardar el avance. Inténtalo de nuevo.");
    }
  });

  async function retry() {
    setRetrying(true);
    retryPosition.current = startedRef.current ? position.current : null;
    try {
      const result = await renewLessonVideoAction(slug, lessonId);
      if (!result.src) { setError(result.error ?? "No pudimos cargar el vídeo."); return; }
      setSource(result.src);
      setAttempt((n) => n + 1);
      setFailed(false);
      setError("");
      startedRef.current = true;
      setStarted(true);
    } catch { setError("No hay conexión. Revisa tu red y vuelve a intentarlo."); }
    finally { setRetrying(false); }
  }

  return (
    <div>
      <div className="relative -mx-4 bg-black md:mx-0 md:overflow-hidden md:rounded-2xl">
        {videoPath && !failed && !started ? (
          <button type="button" aria-label="Reproducir clase" onClick={() => { startedRef.current = true; setStarted(true); }} className="relative block w-full cursor-pointer text-left">
            {poster}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-accent px-6 py-4 font-bold text-accent-ink shadow-xl">▶ {playback?.seconds ? "Retomar clase" : "Ver clase"}</span>
            </span>
          </button>
        ) : source && !failed ? (
          <video
            ref={video}
            key={attempt}
            src={source}
            aria-label="Vídeo de la clase"
            controls playsInline autoPlay preload="metadata" controlsList="nodownload"
            onContextMenu={(event) => event.preventDefault()}
            onLoadedMetadata={(event) => {
              let local: unknown = null;
              try { if (storageKey) local = JSON.parse(localStorage.getItem(storageKey) ?? "null"); } catch { /* Posición local no disponible. */ }
              const target = retryPosition.current ?? resumePosition(playback, local, videoPath ?? "", event.currentTarget.duration);
              retryPosition.current = null;
              position.current = target;
              if (target > 0 && target < event.currentTarget.duration) event.currentTarget.currentTime = target;
            }}
            onTimeUpdate={(event) => {
              position.current = event.currentTarget.currentTime;
              const seconds = Math.floor(position.current);
              if (seconds !== lastLocal.current) remember(seconds, Math.abs(seconds - lastSync.current) >= 10);
            }}
            onSeeked={(event) => { position.current = event.currentTarget.currentTime; remember(position.current, true); }}
            onPause={() => { if (!ended) remember(position.current, true); }}
            onError={() => { setFailed(true); remember(position.current, true); }}
            onEnded={() => { position.current = 0; remember(0, true); setEnded(true); if (canTrack && !isDone) save(true); }}
            onPlay={() => setEnded(false)}
            className="aspect-video w-full"
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 px-6 text-center" role={failed ? "alert" : undefined}>
            <p className="font-semibold">{failed ? "No pudimos reproducir esta clase" : "Esta clase todavía no tiene vídeo"}</p>
            <p className="max-w-[42ch] text-sm text-muted">{failed ? "Revisa tu conexión. Puedes volver a cargar el vídeo sin perder tu punto." : "El creador lo está preparando."}</p>
            {failed && <button type="button" disabled={retrying} onClick={() => void retry()} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink disabled:opacity-60">{retrying ? "Cargando vídeo…" : "Reintentar reproducción"}</button>}
          </div>
        )}
        {ended && !failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 px-6 text-center backdrop-blur-sm">
            <p className="font-display text-xl font-bold">{nextHref ? "¡Clase terminada!" : "¡Llegaste a la última clase!"}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => { position.current = 0; remember(0, true); setEnded(false); if (video.current) { video.current.currentTime = 0; void video.current.play().catch(() => {}); } }} className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold">Ver de nuevo</button>
              {nextHref && <Link href={nextHref} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink">Siguiente clase →</Link>}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canTrack && <button type="button" disabled={pending} onClick={() => save(!isDone)} aria-pressed={isDone} className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${isDone ? "bg-good/15 text-good" : "border border-line text-fg hover:border-fg/30"}`}>{isDone ? "✓ Completada" : "Marcar como completada"}</button>}
        <div className="ml-auto flex gap-2">
          {prevHref && <Link href={prevHref} aria-label="Clase anterior" className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold">←</Link>}
          {nextHref && <Link href={nextHref} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink">Siguiente →</Link>}
        </div>
      </div>
      {syncNotice && <p role="status" className="mt-2 text-xs text-muted">{syncNotice}</p>}
      {error && <p role="alert" className="mt-2 text-[13px] text-bad">{error}</p>}
    </div>
  );
}
