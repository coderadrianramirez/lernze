"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";
import { catalogTrailer } from "@/lib/catalog-media";
import { Stage } from "./Stage";

/** Duración en milisegundos de cada frase del trailer animado. */
export const SCENE_MS = [2400, 2600, 2600, 3000, 2800];
const sceneMs = (i: number) => SCENE_MS[i] ?? 2600;
export const sceneTotalSeconds = (n: number) =>
  Array.from({ length: n }, (_, i) => sceneMs(i)).reduce((a, b) => a + b, 0) /
  1000;

/** Una frase del trailer animado. La cuarta se muestra como testimonio y la última como llamada a entrar. */
export function Scene({
  course,
  i,
  noCta,
}: {
  course: Course;
  i: number;
  noCta?: boolean;
}) {
  const text = course.scenes[i] ?? "";
  const last = i === course.scenes.length - 1 && i > 0;
  if (i === 3 && text.includes(" — ")) {
    const [quote, who] = text.split(" — ");
    return (
      <div className="lz-cap quote">
        {quote}
        <small>{who}</small>
      </div>
    );
  }
  if (last) {
    return (
      <div className="lz-cap cta">
        {text}
        {!noCta && (
          <>
            <br />
            <em>Entrar · {formatPrice(course.priceCents, course.currency)}</em>
          </>
        )}
      </div>
    );
  }
  return <div className="lz-cap">{text}</div>;
}

type Props = {
  course: Course;
  /** Mientras es verdadero se reproduce el trailer; al pasar a falso vuelve a la portada. */
  active: boolean;
  mode?: "h" | "v";
  lockup?: boolean;
  badges?: boolean;
  /** Muestra los controles nativos del video (página del programa). */
  controls?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  /** Si se pasa, las frases las dibuja quien llama y no este componente. */
  onScene?: (scene: number | null) => void;
};

/** Portada con trailer: video real si el programa lo tiene, y si no, trailer animado con sus frases. */
export function StageLive({
  course,
  active,
  mode = "h",
  lockup = true,
  badges = true,
  controls = false,
  onPlayingChange,
  onScene,
}: Props) {
  const generated = catalogTrailer(course);
  const trailerUrl = generated?.video ?? course.trailerUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const hasVideo = Boolean(trailerUrl) && !videoError;
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [scene, setScene] = useState<number | null>(null);
  const playing = hasVideo ? videoPlaying : active;
  const shownScene = active && !hasVideo ? scene : null;
  const n = course.scenes.length || 1;

  // Trailer en video.
  useEffect(() => {
    const v = videoRef.current;
    if (!hasVideo || !v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
    return () => v.pause();
  }, [active, hasVideo]);

  // Trailer animado: cambia de frase con temporizadores.
  useEffect(() => {
    if (hasVideo || !active) return;
    let i = 0;
    let timer: number;
    const show = () => {
      setScene(i);
      timer = window.setTimeout(() => {
        i = (i + 1) % n;
        show();
      }, sceneMs(i));
    };
    timer = window.setTimeout(show, 0);
    return () => {
      window.clearTimeout(timer);
      setScene(null);
    };
  }, [active, hasVideo, n]);

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);
  useEffect(() => {
    onScene?.(shownScene);
  }, [shownScene, onScene]);

  const total = sceneTotalSeconds(n);

  return (
    <Stage
      course={course}
      mode={mode}
      lockup={lockup}
      badges={badges}
      playing={playing}
      cleanVideo={hasVideo && (videoPlaying || controls)}
      under={
        hasVideo ? (
          <video
            ref={videoRef}
            className={`lz-video ${controls ? "ctl" : ""}`}
            src={trailerUrl ?? undefined}
            poster={generated?.image}
            style={
              generated
                ? { objectPosition: `${generated.x}% ${generated.y}%` }
                : undefined
            }
            muted={muted}
            onVolumeChange={(event) => {
              setMuted(event.currentTarget.muted);
              setVolume(event.currentTarget.volume);
            }}
            loop
            playsInline
            preload={controls && active ? "auto" : "none"}
            controls={controls}
            aria-label={`Trailer de ${course.title}`}
            onPlaying={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            onError={() => {
              setVideoError(true);
              setVideoPlaying(false);
            }}
          />
        ) : null
      }
      over={
        <>
          {hasVideo && (videoPlaying || controls) && (
            <div
              className={`lz-audio ${!muted && volume > 0 ? "is-audible" : ""}`}
              role="group"
              aria-label="Audio del trailer"
            >
              <button
                type="button"
                aria-label={muted || volume === 0 ? "Activar audio" : "Silenciar audio"}
                title={muted || volume === 0 ? "Activar audio" : "Silenciar audio"}
                aria-pressed={!muted && volume > 0}
                onClick={(event) => {
                  event.stopPropagation();
                  const video = videoRef.current;
                  if (!video) return;
                  if (video.muted || video.volume === 0) {
                    if (video.volume === 0) video.volume = 0.6;
                    video.muted = false;
                  } else {
                    video.muted = true;
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                  {muted || volume === 0
                    ? <path d="m16 9 6 6m0-6-6 6" />
                    : <><path d="M15 8a6 6 0 0 1 0 8" />{volume > 0.5 && <path d="M18 5a10 10 0 0 1 0 14" />}</>}
                </svg>
              </button>
              <div className="lz-audio-volume">
                <input
                  type="range"
                  aria-label="Volumen del trailer"
                  aria-valuetext={`${Math.round(volume * 100)} %`}
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(volume * 100)}
                  onChange={(event) => {
                    const video = videoRef.current;
                    if (!video) return;
                    const next = Number(event.target.value) / 100;
                    video.volume = next;
                    video.muted = next === 0;
                  }}
                />
              </div>
            </div>
          )}
          {!hasVideo && (
            <>
              {!onScene && (
                <div className="lz-caps" aria-hidden="true">
                  {shownScene !== null && (
                    <Scene
                      key={shownScene}
                      course={course}
                      i={shownScene}
                    />
                  )}
                </div>
              )}
              <div className="lz-bar" aria-hidden="true">
                <i
                  style={
                    active
                      ? { animation: `lzProg ${total}s linear infinite` }
                      : undefined
                  }
                />
              </div>
            </>
          )}
        </>
      }
    />
  );
}
