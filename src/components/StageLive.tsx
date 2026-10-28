"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";
import { Stage } from "./Stage";

/** Duración en milisegundos de cada frase del trailer animado. */
export const SCENE_MS = [2400, 2600, 2600, 3000, 2800];
const sceneMs = (i: number) => SCENE_MS[i] ?? 2600;
export const sceneTotalSeconds = (n: number) => Array.from({ length: n }, (_, i) => sceneMs(i)).reduce((a, b) => a + b, 0) / 1000;

/** Una frase del trailer animado. La cuarta se muestra como testimonio y la última como llamada a entrar. */
export function Scene({ course, i }: { course: Course; i: number }) {
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
        <br />
        <em>Entrar · {formatPrice(course.priceCents, course.currency)}</em>
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
export function StageLive({ course, active, mode = "h", lockup = true, badges = true, controls = false, onPlayingChange, onScene }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const [videoError, setVideoError] = useState(false);
  const hasVideo = Boolean(course.trailerUrl) && !videoError;
  const [videoPlaying, setVideoPlaying] = useState(false);
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
      under={
        hasVideo ? (
          <video
            ref={videoRef}
            className={`lz-video ${controls ? "ctl" : ""}`}
            src={course.trailerUrl ?? undefined}
            muted
            loop
            playsInline
            preload="none"
            controls={controls}
            aria-label={`Trailer de ${course.title}`}
            onPlaying={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            onError={() => { setVideoError(true); setVideoPlaying(false); }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (barRef.current && v.duration) barRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`;
            }}
          />
        ) : null
      }
      over={
        <>
          {!hasVideo && !onScene && (
            <div className="lz-caps" aria-hidden="true">
              {shownScene !== null && <Scene key={shownScene} course={course} i={shownScene} />}
            </div>
          )}
          <div className="lz-bar" aria-hidden="true">
            <i ref={barRef} style={!hasVideo && active ? { animation: `lzProg ${total}s linear infinite` } : undefined} />
          </div>
        </>
      }
    />
  );
}
