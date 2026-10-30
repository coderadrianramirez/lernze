import type { CSSProperties, ReactNode } from "react";
import { coverImageUrl } from "@/lib/covers";
import { artSvg } from "@/lib/art";
import type { Course } from "@/lib/types";

type Props = {
  course: Pick<Course, "id" | "art" | "trailerSource">;
  /** h = 16:9 (billboard, tarjetas horizontales, tarjeta ampliada). v = recorte central para el póster 2:3. */
  mode?: "h" | "v";
  lockup?: boolean;
  badges?: boolean;
  playing?: boolean;
  className?: string;
  /** Capa bajo la luz y el título: el video del trailer. */
  under?: ReactNode;
  /** Capa sobre todo lo demás: frases del trailer y barra de progreso. */
  over?: ReactNode;
};

/** Portada ilustrada de un programa. Sin estado: se puede dibujar en el servidor. */
export function Stage({ course, mode = "h", lockup = true, badges = true, playing = false, className = "", under, over }: Props) {
  const { art } = course;
  return (
    <div
      className={`lz-stage ${playing ? "lz-playing" : ""} ${className}`}
      style={{ "--glow": art.glow } as CSSProperties}
      data-id={course.id}
    >
      <div className="lz-art" dangerouslySetInnerHTML={{ __html: artSvg(art, mode, course.id) }} />
      {coverImageUrl(art.cover?.path) && (
        // eslint-disable-next-line @next/next/no-img-element -- imagen dinámica de Supabase, con encuadre del creador
        <img src={coverImageUrl(art.cover?.path)} alt="" className="lz-cover-image" style={{ objectPosition: `${art.cover?.x ?? 50}% ${art.cover?.y ?? 50}%`, transform: `scale(${art.cover?.zoom ?? 1})` }} />
      )}
      {under}
      <div className="lz-sweep" />
      <div className="lz-shade" />
      {lockup && (
        <div className="lz-lockup">
          {art.lines.map((l, i) => (
            <div key={i} className={i === art.hl ? "hl" : undefined}>
              {l}
            </div>
          ))}
        </div>
      )}
      {badges && (
        <div className="lz-badges">
          <span className={`lz-b ${course.trailerSource === "ai" ? "ai" : "cr"}`}>
            {course.trailerSource === "ai" ? "Trailer IA" : "Trailer del creador"}
          </span>
        </div>
      )}
      {over}
    </div>
  );
}
