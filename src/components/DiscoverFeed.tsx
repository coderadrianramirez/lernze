"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FollowButton } from "@/app/creador/[id]/FollowButton";
import { interestSignalAction } from "@/app/actions/recommendations";
import { Avatar } from "./Avatar";
import { DismissProgram } from "./DismissProgram";
import { Stage } from "./Stage";
import { catalogTrailer } from "@/lib/catalog-media";
import { courseCreatorId, creatorPath } from "@/lib/creator-path";
import { programPath } from "@/lib/copy";
import { formatPrice } from "@/lib/pricing";
import { coverImageUrl } from "@/lib/covers";
import { markRecommendationsDirty } from "@/lib/recommendation-refresh";
import type { Course } from "@/lib/types";
import type { Creator } from "@/lib/creators";
import { restoreDiscovery, watchedSeconds } from "@/lib/discovery";

type Item = { course: Course; reason: string; creator: Creator | null };
type Props = { items: Item[]; userId?: string; following: string[]; canDismiss: boolean; followReady: boolean };

export function DiscoverFeed({ items, userId, following, canDismiss, followReady }: Props) {
  const [order, setOrder] = useState(items.map(i => i.course.id));
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [ready, setReady] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [message, setMessage] = useState("");
  const track = useRef<HTMLDivElement>(null);
  const position = useRef({ id: "", time: 0 });
  const recorded = useRef(new Set<string>());
  const storageKey = `lernze:descubrir:${userId ?? "visitante"}`;
  const byId = new Map(items.map(i => [i.course.id, i]));
  const feed = order.flatMap(id => { const item = byId.get(id); return item && !hidden.includes(id) ? [item] : []; });
  const current = Math.min(index, Math.max(0, feed.length - 1));
  const activeId = feed[current]?.course.id;

  // Solo IDs públicos y posición, separados por cuenta. Activity ejecuta la limpieza al salir.
  useEffect(() => {
    const body = document.body;
    body.classList.add("lz-discover-page");
    let snapshot: unknown;
    try { snapshot = JSON.parse(sessionStorage.getItem(storageKey) ?? "null"); } catch { /* almacenamiento opcional */ }
    const restored = restoreDiscovery(items.map(i => i.course.id), snapshot, Date.now());
    const frame = requestAnimationFrame(() => {
      setOrder(restored.ids);
      setResumeTime(restored.time);
      position.current = { id: restored.ids[restored.index] ?? "", time: restored.time };
      setIndex(restored.index);
      if (track.current) track.current.scrollTop = restored.index * track.current.clientHeight;
      setReady(true);
    });
    return () => { cancelAnimationFrame(frame); body.classList.remove("lz-discover-page"); };
  }, [items, storageKey]);

  useEffect(() => {
    if (!ready) return;
    const save = () => {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ ids: feed.map(i => i.course.id), active: position.current.id || activeId, time: position.current.time, at: Date.now() })); } catch { /* modo privado */ }
    };
    window.addEventListener("pagehide", save);
    return () => { save(); window.removeEventListener("pagehide", save); };
  }, [activeId, feed, ready, storageKey]);

  useEffect(() => {
    const el = track.current;
    if (!el || !ready) return;
    const observer = new ResizeObserver(() => { el.scrollTop = current * el.clientHeight; });
    observer.observe(el);
    return () => observer.disconnect();
  }, [current, ready]);

  const move = (next: number) => {
    if (!track.current) return;
    setEngaged(true);
    track.current.scrollTo({ top: Math.max(0, Math.min(next, feed.length - 1)) * track.current.clientHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const keyDown = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement).closest("input,button,a,select,textarea,[contenteditable=true]")) return;
    if (["ArrowDown", "PageDown", "ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault(); move(current + (["ArrowDown", "PageDown"].includes(event.key) ? 1 : -1));
    } else if (event.key === " ") { event.preventDefault(); setEngaged(true); setPaused(v => !v); }
  };
  const qualify = useCallback((id: string) => {
    if (!userId || recorded.current.has(id)) return;
    recorded.current.add(id);
    void interestSignalAction(id, "trailer").then(r => { if (r.saved) markRecommendationsDirty(); }).catch(() => {});
  }, [userId]);

  async function share(course: Course) {
    const url = `${window.location.origin}${programPath(course.slug)}?src=discover`;
    try {
      if (navigator.share) await navigator.share({ title: course.title, url });
      else { await navigator.clipboard.writeText(url); setMessage("Enlace copiado"); }
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("No pudimos compartir. Abre el programa y copia su enlace."); }
  }

  return <div className="discover-shell" onKeyDown={keyDown}>
    <div className="discover-topbar">
      <div className="discover-heading"><h1>Descubrir<span>.</span></h1><span className="discover-label">Para ti</span></div>
      <div className="discover-top-actions"><span className="discover-counter" aria-live="polite">{feed.length ? current + 1 : 0} <span>/ {feed.length}</span></span><Link href="/" className="discover-catalogue">Ver catálogo ↗</Link></div>
    </div>
    {!feed.length ? <div className="discover-empty"><span className="discover-label">Una pausa para descubrir</span><h2>Ya exploraste estas opciones</h2><p>Puedes buscar otros programas o recuperar recomendaciones desde tus intereses.</p><Link className="discover-cta" href={userId ? "/intereses" : "/buscar"}>{userId ? "Ver tus intereses" : "Buscar programas"} →</Link></div> : <>
      <div ref={track} className="discover-track" tabIndex={0} aria-label="Trailers de programas. Desliza o usa las flechas para avanzar" onScroll={event => {
        if (!ready) return;
        const el = event.currentTarget, next = Math.round(el.scrollTop / el.clientHeight);
        if (next !== current) { position.current = { id: feed[next]?.course.id ?? "", time: 0 }; setResumeTime(0); setIndex(next); setPaused(false); setEngaged(true); setMessage(""); }
      }}>
        {feed.map((item, i) => {
          const { course, creator } = item, id = courseCreatorId(course), active = i === current;
          return <article key={course.id} className="discover-slide" aria-label={`${i + 1}. ${course.title}`} aria-current={active ? "true" : undefined} inert={!active}>
            <div className="discover-slide-inner">
              <div className="discover-player-wrap">
                {Math.abs(i - current) <= 1 ? <Player key={course.id} course={course} active={active && ready} paused={paused} muted={muted} volume={volume} engaged={engaged} resumeTime={active ? resumeTime : 0} onInteract={() => setEngaged(true)} onPause={() => { setEngaged(true); setPaused(v => !v); }} onMute={() => { setEngaged(true); if (volume === 0) setVolume(0.7); setMuted(v => !v); }} onVolume={value => { setEngaged(true); setVolume(value); setMuted(value === 0); }} onPosition={time => { if (active) position.current = { id: course.id, time }; }} onQualified={qualify} /> : <div className="discover-player"><Stage course={course} badges={false} lockup={false} /></div>}
              </div>
              <div className="discover-info">
                <div className="discover-creator-row"><Link href={creatorPath(id)} className="discover-creator"><Avatar name={creator?.name ?? course.creatorName} src={creator?.avatarUrl} /><span><strong>{creator?.name ?? course.creatorName}</strong><small>{id.startsWith("demo-") ? "Creador de ejemplo" : "Creador en Lernze"}</small></span></Link>
                  {!id.startsWith("demo-") && followReady && <FollowButton creatorId={id} creatorName={course.creatorName} followers={creator?.followers ?? 0} following={following.includes(id)} signedIn={Boolean(userId)} own={id === userId} ready={followReady} />}
                </div>
                <div className="discover-program"><span className="discover-category">{course.category} <span>· Trailer</span></span><h2>{course.title}</h2><p className="discover-description">{course.description}</p></div>
                <p className="discover-reason">{item.reason}</p>
                <div className="discover-purchase"><span className="discover-price">{formatPrice(course.priceCents, course.currency)}<small>Pago único</small></span><Link href={`${programPath(course.slug)}?src=discover`} className="discover-cta">Ver programa <span aria-hidden="true">↗</span></Link></div>
                <div className="discover-secondary"><button type="button" onClick={() => void share(course)}><Icon name="share" /> Compartir</button><Link href="/intereses">Tus intereses</Link></div>
                {canDismiss && <DismissProgram courseId={course.id} onHidden={() => { position.current = { id: feed[current + 1]?.course.id ?? feed[current - 1]?.course.id ?? "", time: 0 }; setHidden(old => [...old, course.id]); setMessage("Programa ocultado. Puedes recuperarlo desde Intereses."); }} />}
                <p className="discover-hint"><span aria-hidden="true">↓</span> Desliza para descubrir otra idea</p>
              </div>
            </div>
          </article>;
        })}
      </div>
      <nav className="discover-arrows" aria-label="Cambiar trailer"><button type="button" aria-label="Trailer anterior" disabled={current === 0} onClick={() => move(current - 1)}><Icon name="up" /></button><button type="button" aria-label="Siguiente trailer" disabled={current === feed.length - 1} onClick={() => move(current + 1)}><Icon name="down" /></button></nav>
    </>}
    <div className="discover-toast" role="status">{message}</div>
  </div>;
}

type PlayerProps = { course: Course; active: boolean; paused: boolean; muted: boolean; volume: number; engaged: boolean; resumeTime: number; onInteract: () => void; onPause: () => void; onMute: () => void; onVolume: (volume: number) => void; onPosition: (time: number) => void; onQualified: (id: string) => void };

function Player({ course, active, paused, muted, volume, engaged, resumeTime, onInteract, onPause, onMute, onVolume, onPosition, onQualified }: PlayerProps) {
  const generated = catalogTrailer(course), src = generated?.video ?? course.trailerUrl;
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const watch = useRef({ last: 0, seconds: 0 });
  const restored = useRef(false);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active && !restored.current && v.readyState >= 1 && Number.isFinite(v.duration)) {
      if (resumeTime > 0) v.currentTime = Math.min(resumeTime, Math.max(0, v.duration - 0.1));
      restored.current = true;
      watch.current.last = v.currentTime;
    }
    const sync = () => {
      if (!active || paused || document.hidden || (!engaged && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) v.pause();
      else void v.play().catch(() => setBlocked(true));
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => { v.pause(); document.removeEventListener("visibilitychange", sync); };
  }, [active, paused, engaged, failed, resumeTime]);
  useEffect(() => { const v = video.current; if (v) { v.volume = volume; v.muted = muted; } }, [volume, muted, active]);
  const toggle = () => {
    onInteract();
    if (blocked || (!playing && !paused)) { setBlocked(false); void video.current?.play().catch(() => setBlocked(true)); }
    else onPause();
  };
  return <div className={`discover-player ${playing ? "is-playing" : ""}`}>
    {src && !failed ? <>
      <video ref={video} src={src} poster={coverImageUrl(course.art.cover?.path) ?? generated?.image} muted={muted} loop playsInline preload={active ? "auto" : "metadata"} aria-label={`Trailer de ${course.title}`} onPlaying={() => { setPlaying(true); setBlocked(false); }} onPause={() => setPlaying(false)} onError={() => setFailed(true)} onLoadedMetadata={event => { const v = event.currentTarget; if (active && !restored.current) { if (resumeTime > 0 && Number.isFinite(v.duration)) v.currentTime = Math.min(resumeTime, Math.max(0, v.duration - 0.1)); restored.current = true; } watch.current.last = v.currentTime; }} onTimeUpdate={event => {
        const v = event.currentTarget;
        if (!active) return;
        onPosition(v.currentTime);
        setProgress(Number.isFinite(v.duration) && v.duration > 0 ? v.currentTime / v.duration : 0);
        watch.current.seconds += watchedSeconds(watch.current.last, v.currentTime, engaged && !paused && !document.hidden && !v.seeking && !v.paused);
        watch.current.last = v.currentTime;
        if (watch.current.seconds >= 8) onQualified(course.id);
      }} onSeeking={event => { watch.current.last = event.currentTarget.currentTime; }} />
      <button className="discover-video-toggle" type="button" tabIndex={-1} aria-label={playing ? "Pausar trailer" : "Reproducir trailer"} onClick={toggle}>{!playing && <span><Icon name="play" /></span>}</button>
      <div className="discover-media-controls"><button type="button" aria-label={playing ? "Pausar" : "Reproducir"} onClick={toggle}><Icon name={playing ? "pause" : "play"} /></button><div className="discover-volume"><input aria-label="Volumen del trailer" type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={event => onVolume(Number(event.target.value) / 100)} /><button type="button" aria-label={muted || volume === 0 ? "Activar audio" : "Silenciar audio"} aria-pressed={!muted && volume > 0} onClick={onMute}><Icon name={muted || volume === 0 ? "muted" : "audio"} /></button></div></div>
      <div className="discover-progress" role="progressbar" aria-label="Progreso del trailer" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ transform: `scaleX(${progress})` }} /></div>
    </> : <><Stage course={course} badges={false} /><div className="discover-no-video"><span>{failed ? "No se pudo reproducir el trailer" : "Conoce este programa"}</span>{failed && <button type="button" onClick={() => setFailed(false)}>Reintentar</button>}</div></>}
  </div>;
}

function Icon({ name }: { name: "play" | "pause" | "muted" | "audio" | "share" | "up" | "down" }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === "play" ? <path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none" /> : name === "pause" ? <path d="M8 5v14M16 5v14" strokeWidth="4" /> : name === "up" ? <path d="m6 15 6-6 6 6" /> : name === "down" ? <path d="m6 9 6 6 6-6" /> : name === "share" ? <><path d="M12 16V3m-5 5 5-5 5 5M5 14v6h14v-6" /></> : <><path d="M11 5 6 9H3v6h3l5 4V5Z" />{name === "muted" ? <path d="m16 9 6 6m0-6-6 6" /> : <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>}</>}</svg>;
}
