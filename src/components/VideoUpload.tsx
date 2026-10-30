"use client";

import { useRef, useState } from "react";
import { createUploadAction, type UploadKind } from "@/app/actions/upload";

const MAX_BYTES = 50 * 1024 * 1024;

export type UploadedVideo = { path: string; url: string | null; seconds: number; name: string };

type Props = {
  kind: UploadKind;
  courseId?: string;
  /** Duración máxima permitida en segundos. */
  maxSeconds: number;
  label?: string;
  hint?: string;
  value: UploadedVideo | null;
  onChange: (v: UploadedVideo | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

/** Lee la duración del video en el navegador, antes de subirlo. */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(v.duration) ? Math.round(v.duration) : 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    v.src = url;
  });
}

/** Sube el archivo al permiso firmado, informando el progreso (fetch no lo permite). */
function put(url: string, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("red"));
    xhr.send(body);
  });
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function VideoUpload({ kind, courseId, maxSeconds, label = "Video", hint, value, onChange, onUploadingChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      setError("Sube el video en MP4 o WebM. Si grabaste con iPhone, compártelo como “Más compatible”.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("El video pesa más de 50 MB. Acórtalo o expórtalo en menor calidad.");
      return;
    }
    setProgress(0);
    onUploadingChange?.(true);
    const seconds = await readDuration(file);
    if (seconds > maxSeconds) {
      setProgress(null);
      onUploadingChange?.(false);
      setError(`El video dura ${fmt(seconds)}. El máximo es ${fmt(maxSeconds)}.`);
      return;
    }

    setProgress(0);
    let ticket;
    try { ticket = await createUploadAction(kind, file.type, courseId); }
    catch { setProgress(null); onUploadingChange?.(false); setError("No pudimos iniciar la subida. Inténtalo de nuevo."); return; }
    if (!ticket.ok) {
      setProgress(null);
      onUploadingChange?.(false);
      setError(ticket.error);
      return;
    }
    try {
      await put(ticket.signedUrl, file, setProgress);
    } catch {
      setProgress(null);
      onUploadingChange?.(false);
      setError("Se cortó la subida. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    setProgress(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    onUploadingChange?.(false);
    onChange({ path: ticket.path, url: ticket.publicUrl, seconds, name: file.name });
  }

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(null);
    if (input.current) input.current.value = "";
  };

  const uploading = progress !== null;

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {value ? (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {preview || value.url ? (
            <video src={preview ?? value.url ?? undefined} controls playsInline className="aspect-video w-full bg-black" />
          ) : null}
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-good/15 text-good" aria-hidden>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{value.name}</p>
              <p className="text-xs text-muted">Subido · {fmt(value.seconds)}</p>
            </div>
            <button type="button" disabled={uploading} onClick={() => input.current?.click()} className="cursor-pointer px-2 py-1 text-sm font-semibold text-accent">
              Cambiar
            </button>
            <button type="button" disabled={uploading} onClick={clear} className="cursor-pointer px-2 py-1 text-sm text-muted hover:text-fg">
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-8 text-center transition-colors hover:border-accent/60 active:bg-surface-2 disabled:cursor-default"
        >
          {uploading ? (
            <>
              <p className="text-sm font-semibold">Subiendo… {Math.round(progress * 100)}%</p>
              <span className="h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-line" aria-hidden>
                <span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
              <p className="text-xs text-muted">No cierres esta página.</p>
            </>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                </svg>
              </span>
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-muted">{hint ?? `MP4 o WebM · hasta 50 MB · máximo ${fmt(maxSeconds)}`}</p>
            </>
          )}
        </button>
      )}

      {uploading && <span role="status" className="sr-only">{`Subiendo ${Math.round((progress ?? 0) * 100)}%`}</span>}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
