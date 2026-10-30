"use client";

import { useId, useRef, useState } from "react";
import { createCoverUploadAction } from "@/app/actions/media";
import { defaultArt } from "@/lib/art";
import { COVER_TONES, withCover } from "@/lib/covers";
import type { ArtConfig, Category, CoverConfig } from "@/lib/types";
import type { MediaAsset } from "@/lib/media-management";
import { catalogCover } from "@/lib/catalog-media";
import { Stage } from "./Stage";

const field =
  "w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-fg";
const defaults: CoverConfig = {
  path: null,
  title: "",
  x: 50,
  y: 50,
  zoom: 1,
  tone: "amber",
};

import { imageBlob } from "@/lib/browser-image";

export function CoverEditor({
  title,
  category = "Oficios",
  art,
  videoUrl,
  courseId,
  automaticCoverId,
  value,
  onChange,
  onBusyChange,
  onAsset,
  disabled = false,
  enabled = true,
}: {
  title: string;
  category?: Category;
  art?: ArtConfig;
  videoUrl?: string | null;
  courseId?: string;
  automaticCoverId?: string;
  value: CoverConfig | null;
  onChange: (value: CoverConfig | null) => void;
  onBusyChange: (busy: boolean) => void;
  onAsset: (asset: MediaAsset) => void;
  disabled?: boolean;
  enabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"illustration" | "image" | "video">(
    value?.path ||
      (automaticCoverId &&
        catalogCover({
          id: automaticCoverId,
          art: { ...(art ?? defaultArt(title, category, id)), cover: value },
        }))
      ? "image"
      : "illustration",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [format, setFormat] = useState<"h" | "v">("h");
  const cover = value ?? defaults;
  const blocked = disabled || busy;
  const update = (patch: Partial<CoverConfig>) =>
    onChange({ ...cover, ...patch });
  const setWorking = (working: boolean) => {
    setBusy(working);
    onBusyChange(working);
  };

  async function upload(blob: Blob) {
    const ticket = await createCoverUploadAction(courseId);
    if (ticket.error || !ticket.signedUrl || !ticket.path)
      throw new Error(ticket.error || "No pudimos preparar la portada.");
    const body = new FormData();
    body.append("", blob, "portada.webp");
    const result = await fetch(ticket.signedUrl, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body,
    });
    if (!result.ok)
      throw new Error("No pudimos subir la imagen. Inténtalo de nuevo.");
    onAsset({ bucket: "covers", path: ticket.path });
    onChange({ ...cover, path: ticket.path, x: 50, y: 50, zoom: 1 });
  }

  async function choose(file: File | undefined) {
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Elige una imagen JPG, PNG o WebP de hasta 8 MB.");
      return;
    }
    setWorking(true);
    try {
      await upload(await imageBlob(file));
      setMode("image");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos leer la imagen.");
    } finally {
      setWorking(false);
      if (input.current) input.current.value = "";
    }
  }

  async function capture() {
    if (!video.current || video.current.readyState < 2) {
      setError("Espera a que cargue el video y elige un momento.");
      return;
    }
    setError("");
    setWorking(true);
    try {
      const source = video.current;
      const canvas = document.createElement("canvas");
      const ratio = Math.min(
        1,
        1920 / Math.max(source.videoWidth, source.videoHeight),
      );
      canvas.width = Math.max(1, Math.round(source.videoWidth * ratio));
      canvas.height = Math.max(1, Math.round(source.videoHeight * ratio));
      canvas
        .getContext("2d")!
        .drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error())),
          "image/webp",
          0.86,
        ),
      );
      await upload(blob);
    } catch {
      setError(
        "No pudimos capturar este video. Prueba con un video subido a Lernze o elige una imagen propia.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <fieldset className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold">Portada</legend>
      <p className="mb-4 text-sm text-muted">
        Tu contenido, con el estilo de Lernze. El título se integra
        automáticamente.
      </p>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div
            className={
              format === "h" ? "lz-thumb" : "lz-poster mx-auto max-w-[170px]"
            }
          >
            <Stage
              course={{
                id: automaticCoverId ?? "cover" + id.replace(/:/g, ""),
                art: withCover(
                  art ?? defaultArt(title || "Tu contenido", category, id),
                  title || "Tu contenido",
                  value,
                ),
                trailerSource: "creator",
              }}
              mode={format}
              badges={false}
            />
          </div>
          <div
            className="mt-3 flex justify-center gap-2"
            aria-label="Formato de vista previa"
          >
            {(["h", "v"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={format === f}
                onClick={() => setFormat(f)}
                className={
                  "cursor-pointer rounded-lg border px-3 py-2 text-xs " +
                  (format === f
                    ? "border-accent text-accent"
                    : "border-line text-muted")
                }
              >
                {f === "h" ? "Horizontal" : "Vertical"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">
            La misma portada se adapta a las tarjetas y al reproductor.
          </p>
        </div>
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="Origen de portada">
            <button
              type="button"
              disabled={blocked}
              aria-pressed={mode === "illustration"}
              onClick={() => {
                setMode("illustration");
                update({ path: null });
                setError("");
              }}
              className={
                "cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold " +
                (mode === "illustration"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line")
              }
            >
              Ilustración
            </button>
            <button
              type="button"
              disabled={blocked || !enabled || !videoUrl}
              aria-pressed={mode === "video"}
              onClick={() => {
                setMode("video");
                setError("");
              }}
              className={
                "cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-default disabled:opacity-40 " +
                (mode === "video"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line")
              }
            >
              Del video
            </button>
            <button
              type="button"
              disabled={blocked || !enabled}
              aria-pressed={mode === "image"}
              onClick={() => input.current?.click()}
              className={
                "cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-default disabled:opacity-40 " +
                (mode === "image"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line")
              }
            >
              Subir imagen
            </button>
          </div>
          {!videoUrl && (
            <p className="text-xs text-muted">
              Sube tu video para elegir uno de sus fotogramas.
            </p>
          )}
          {!enabled && (
            <p className="text-xs text-muted">
              Las imágenes y fotogramas estarán disponibles en breve. Puedes
              usar la ilustración.
            </p>
          )}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => void choose(e.target.files?.[0])}
          />
          <label className="block text-xs text-muted" htmlFor={id + "title"}>
            Título en portada (opcional)
            <input
              id={id + "title"}
              value={cover.title}
              maxLength={120}
              disabled={blocked}
              onChange={(e) => update({ title: e.target.value })}
              className={field + " mt-1.5"}
              placeholder={title || "Usar el título del contenido"}
            />
          </label>
          <div>
            <p className="mb-2 text-xs text-muted">Color de acento</p>
            <div className="flex gap-2">
              {Object.entries(COVER_TONES).map(([tone, color]) => (
                <button
                  type="button"
                  key={tone}
                  disabled={blocked}
                  aria-label={
                    tone === "amber"
                      ? "Ámbar"
                      : tone === "teal"
                        ? "Turquesa"
                        : "Rosa"
                  }
                  aria-pressed={cover.tone === tone}
                  onClick={() => update({ tone: tone as CoverConfig["tone"] })}
                  style={{ background: color }}
                  className={
                    "h-8 w-8 cursor-pointer rounded-full border-2 " +
                    (cover.tone === tone
                      ? "border-fg ring-2 ring-line"
                      : "border-transparent")
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {mode === "video" && videoUrl && (
        <div className="mt-5 rounded-xl border border-line bg-ink p-3">
          <video
            ref={video}
            key={videoUrl}
            src={videoUrl}
            crossOrigin="anonymous"
            controls
            playsInline
            preload="auto"
            onLoadedMetadata={(e) =>
              setDuration(
                Number.isFinite(e.currentTarget.duration)
                  ? e.currentTarget.duration
                  : 0,
              )
            }
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onError={() =>
              setError(
                "No pudimos abrir el video. Puedes subir una imagen propia.",
              )
            }
            className="aspect-video w-full rounded-lg bg-black"
          />
          <label className="mt-3 block text-xs text-muted">
            Elige el momento · {time.toFixed(1)} s
            <input
              aria-label="Momento del video"
              type="range"
              min={0}
              max={Math.max(duration, 0.1)}
              step={0.1}
              value={Math.min(time, Math.max(duration, 0.1))}
              disabled={blocked || !duration}
              onChange={(e) => {
                const t = Number(e.target.value);
                setTime(t);
                if (video.current) video.current.currentTime = t;
              }}
              className="mt-2 w-full accent-accent"
            />
          </label>
          <button
            type="button"
            disabled={blocked}
            onClick={() => void capture()}
            className="mt-3 w-full cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-50"
          >
            Usar este fotograma
          </button>
        </div>
      )}
      {cover.path && (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
          {(
            [
              {
                key: "x",
                text: "Encuadre horizontal",
                min: 0,
                max: 100,
                step: 1,
              },
              {
                key: "y",
                text: "Encuadre vertical",
                min: 0,
                max: 100,
                step: 1,
              },
              {
                key: "zoom",
                text: "Acercar imagen",
                min: 1,
                max: 2,
                step: 0.05,
              },
            ] as const
          ).map((r) => (
            <label key={r.key} className="text-xs text-muted">
              {r.text}
              <input
                type="range"
                aria-label={r.text}
                min={r.min}
                max={r.max}
                step={r.step}
                value={cover[r.key]}
                disabled={blocked}
                onChange={(e) => update({ [r.key]: Number(e.target.value) })}
                className="mt-2 w-full accent-accent"
              />
            </label>
          ))}
        </div>
      )}
      {busy && (
        <p role="status" className="mt-3 text-sm text-accent">
          Preparando tu portada…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}
      {value && (
        <button
          type="button"
          disabled={blocked}
          onClick={() => {
            onChange(null);
            setMode("illustration");
            setError("");
          }}
          className="mt-4 cursor-pointer text-xs font-semibold text-muted hover:text-fg"
        >
          Restablecer portada automática
        </button>
      )}
      <p className="mt-4 text-[11px] text-muted">
        La portada es pública y puede aparecer en el catálogo o el temario. Los
        videos privados conservan sus permisos.
      </p>
    </fieldset>
  );
}
