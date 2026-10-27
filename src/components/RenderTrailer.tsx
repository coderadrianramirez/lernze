"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import type { Course } from "@/lib/types";
import { SCENE_MS, Scene, sceneTotalSeconds } from "./StageLive";
import { Stage } from "./Stage";

/** Segundos con el título en pantalla antes de que empiecen las frases. */
export const RENDER_INTRO = 0.7;

declare global {
  interface Window {
    __lzSetTime?: (t: number) => boolean;
    __lzReady?: boolean;
  }
}

/**
 * Dibuja el trailer animado en un instante exacto, para grabarlo cuadro por cuadro (scripts/render-trailers.mjs).
 * No usa temporizadores: el tiempo lo fija quien graba con window.__lzSetTime(segundos).
 */
export function RenderTrailer({ course }: { course: Course }) {
  const [t, setT] = useState(0);
  const n = course.scenes.length;
  const total = sceneTotalSeconds(n);
  const tt = Math.max(0, t - RENDER_INTRO);
  const playing = t >= RENDER_INTRO;

  let scene = 0;
  let sceneStart = 0;
  for (let i = 0, acc = 0; i < n; i++) {
    const d = (SCENE_MS[i] ?? 2600) / 1000;
    if (tt >= acc) {
      scene = i;
      sceneStart = acc;
    }
    acc += d;
  }

  useEffect(() => {
    window.__lzSetTime = (x: number) => {
      flushSync(() => setT(x));
      return true;
    };
    window.__lzReady = true;
  }, []);

  // Pone todas las animaciones y transiciones de CSS en el instante pedido.
  useLayoutEffect(() => {
    document.getAnimations().forEach((a) => {
      a.pause();
      const name = (a as CSSAnimation).animationName;
      if (name === "lzCapIn") a.currentTime = Math.max(0, (tt - sceneStart) * 1000);
      else if (name) a.currentTime = tt * 1000;
      else a.currentTime = Math.max(0, tt * 1000);
    });
  });

  return (
    <div className="lz-render">
      <Stage
        course={course}
        badges={false}
        playing={playing}
        over={
          <>
            <div className="lz-caps" aria-hidden="true">
              {playing && tt < total && <Scene key={scene} course={course} i={scene} />}
            </div>
            <div className="lz-bar" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (tt / total) * 100)}%` }} />
            </div>
          </>
        }
      />
    </div>
  );
}
