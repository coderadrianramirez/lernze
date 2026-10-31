"use client";

import { useEffect, useRef, useState } from "react";
import type { Upload } from "tus-js-client";
import { createUploadAction, type UploadKind } from "@/app/actions/upload";
import { discardMediaAction } from "@/app/actions/media";

const MAX_BYTES = 50 * 1024 * 1024;
export type UploadedVideo = { path: string; url: string | null; seconds: number; name: string; previewUrl?: string };
type Props = {
  kind: UploadKind; courseId?: string; maxSeconds: number; label?: string; hint?: string;
  value: UploadedVideo | null; onChange: (value: UploadedVideo | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
};
type Phase = "idle" | "preparing" | "uploading" | "paused" | "failed";

/** Un archivo ilegible no cuenta como un vídeo de cero segundos. */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let finished = false;
    const finish = (seconds?: number) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      if (seconds && Number.isFinite(seconds)) resolve(Math.ceil(seconds));
      else reject(new Error("No pudimos leer este vídeo. Expórtalo como MP4 compatible y vuelve a intentarlo."));
    };
    const timer = setTimeout(() => finish(), 20000);
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish();
    video.src = url;
  });
}
const fmt = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function VideoUpload({ kind, courseId, maxSeconds, label = "Vídeo", hint, value, onChange, onUploadingChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useRef<Upload | null>(null);
  const generation = useRef(0);
  const previewRef = useRef<string | null>(null);
  const pendingAsset = useRef<{ bucket: "trailers" | "lessons"; path: string } | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const busy = phase !== "idle";

  useEffect(() => () => {
    generation.current++;
    void upload.current?.abort().catch(() => {});
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  async function cancel() {
    generation.current++;
    const current = upload.current;
    upload.current = null;
    await current?.abort(true).catch(() => {});
    const asset = pendingAsset.current;
    pendingAsset.current = null;
    if (asset) {
      try {
        const result = await discardMediaAction([asset]);
        if (result.error) setError(result.error);
      } catch { setError("La subida se detuvo, pero no pudimos limpiar el archivo pendiente."); }
    }
    setPhase("idle");
    setProgress(0);
    onUploadingChange?.(false);
    if (input.current) input.current.value = "";
  }

  async function pick(file: File | undefined) {
    if (!file || busy) return;
    setError("");
    if (!["video/mp4", "video/webm"].includes(file.type)) { setError("Sube un MP4 o WebM. Si grabaste con iPhone, expórtalo como «Más compatible»."); return; }
    if (file.size > MAX_BYTES) { setError("El vídeo supera el límite actual de 50 MB. Expórtalo con menor peso para subirlo."); return; }
    const current = ++generation.current;
    setPhase("preparing");
    setProgress(0);
    onUploadingChange?.(true);
    try {
      const seconds = await readDuration(file);
      if (current !== generation.current) return;
      if (seconds > maxSeconds) throw new Error(`El vídeo dura ${fmt(seconds)}. El máximo es ${fmt(maxSeconds)}.`);
      const ticket = await createUploadAction(kind, file.type, courseId);
      if (current !== generation.current) return;
      if (!ticket.ok) throw new Error(ticket.error);
      pendingAsset.current = { bucket: ticket.bucket as "lessons" | "trailers", path: ticket.path };
      const { Upload } = await import("tus-js-client");
      if (current !== generation.current) return;
      const task = new Upload(file, {
        endpoint: ticket.endpoint,
        headers: { "x-signature": ticket.token, "x-upsert": "false" },
        metadata: { bucketName: ticket.bucket, objectName: ticket.path, contentType: file.type, cacheControl: "3600" },
        chunkSize: 6 * 1024 * 1024,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        uploadDataDuringCreation: true,
        storeFingerprintForResuming: false,
        onProgress: (sent, total) => { if (current === generation.current) setProgress(total ? sent / total : 0); },
        onError: () => {
          if (current !== generation.current) return;
          setPhase("failed");
          setError("La conexión se interrumpió. Reanuda la subida para continuar desde el fragmento recibido.");
        },
        onSuccess: () => {
          if (current !== generation.current) return;
          pendingAsset.current = null;
          upload.current = null;
          if (previewRef.current) URL.revokeObjectURL(previewRef.current);
          const url = URL.createObjectURL(file);
          previewRef.current = url;
          setPreview(url);
          setPhase("idle");
          setError("");
          onUploadingChange?.(false);
          onChange({ path: ticket.path, url: ticket.publicUrl, seconds, name: file.name, previewUrl: url });
        },
      });
      upload.current = task;
      setPhase("uploading");
      task.start();
    } catch (failure) {
      if (current !== generation.current) return;
      setPhase("idle");
      onUploadingChange?.(false);
      setError(failure instanceof Error ? failure.message : "No pudimos iniciar la subida. Inténtalo de nuevo.");
    }
  }

  async function togglePause() {
    const current = upload.current;
    if (!current) return;
    if (phase === "uploading") {
      await current.abort().catch(() => {});
      if (upload.current === current) setPhase("paused");
    } else {
      setError("");
      setPhase("uploading");
      current.start();
    }
  }

  function clear() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    onChange(null);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <input ref={input} type="file" accept="video/mp4,video/webm" className="sr-only" tabIndex={-1} aria-hidden onChange={(event) => void pick(event.target.files?.[0])} />
      {busy ? (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold" role="status">{phase === "preparing" ? "Preparando vídeo…" : phase === "paused" ? "Subida pausada" : phase === "failed" ? "Subida interrumpida" : `Subiendo… ${Math.round(progress * 100)}%`}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Progreso de subida" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Puedes pausar y continuar en esta pestaña. Mantén la página abierta hasta terminar.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {phase !== "preparing" && <button type="button" onClick={() => void togglePause()} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">{phase === "uploading" ? "Pausar subida" : "Reanudar subida"}</button>}
            <button type="button" onClick={() => void cancel()} className="rounded-lg px-3 py-2 text-sm text-muted">Cancelar subida</button>
          </div>
        </div>
      ) : value ? (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {(preview || value.url) && <video src={preview ?? value.url ?? undefined} controls playsInline className="aspect-video w-full bg-black" />}
          <div className="flex flex-wrap items-center gap-2 px-3 py-3">
            <span className="text-good" aria-hidden>✓</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{value.name}</p><p className="text-xs text-muted">Subido · {fmt(value.seconds)}</p></div>
            <button type="button" onClick={() => input.current?.click()} className="px-2 py-2 text-sm font-semibold text-accent">Cambiar</button>
            <button type="button" onClick={clear} className="px-2 py-2 text-sm text-muted">Quitar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-8 text-center hover:border-accent/60">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-xl text-accent" aria-hidden>↑</span>
          <span className="font-semibold">{label}</span>
          <span className="text-xs text-muted">{hint ?? `MP4 o WebM · hasta 50 MB · máximo ${fmt(maxSeconds)}`}</span>
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-bad">{error}</p>}
    </div>
  );
}
