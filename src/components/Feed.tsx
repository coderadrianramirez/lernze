"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { NOUN, memberCount, programPath } from "@/lib/copy";
import { formatDuration, formatPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";
import { Stage } from "./Stage";
import { StageLive } from "./StageLive";

export type FeedRow = { key: string; title: string; items: Course[] };

type Props = {
  heroes: Course[];
  rows: FeedRow[];
  /** Controles entre el billboard y las filas (intereses). */
  controls: ReactNode;
  demo: boolean;
};

const stars = (c: Course) => (c.rating > 0 ? `★ ${c.rating.toFixed(1)}` : "Nuevo");

export function Feed({ heroes, rows, controls, demo }: Props) {
  const [modal, setModal] = useState<Course | null>(null);
  const [pop, setPop] = useState<{ course: Course; left: number; top: number; width: number } | null>(null);
  const timers = useRef<{ hover?: number; leave?: number }>({});
  const dlgRef = useRef<HTMLDialogElement>(null);

  const closePop = useCallback(() => {
    window.clearTimeout(timers.current.hover);
    window.clearTimeout(timers.current.leave);
    setPop(null);
  }, []);
  const scheduleClose = useCallback(() => {
    window.clearTimeout(timers.current.leave);
    timers.current.leave = window.setTimeout(() => setPop(null), 140);
  }, []);

  useEffect(() => {
    const t = timers.current;
    window.addEventListener("scroll", closePop, { passive: true });
    window.addEventListener("resize", closePop);
    return () => {
      window.removeEventListener("scroll", closePop);
      window.removeEventListener("resize", closePop);
      window.clearTimeout(t.hover);
      window.clearTimeout(t.leave);
    };
  }, [closePop]);

  useEffect(() => {
    const d = dlgRef.current;
    if (!d) return;
    if (modal && !d.open) d.showModal();
    if (!modal && d.open) d.close();
  }, [modal]);

  function enter(el: HTMLElement, c: Course) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    window.clearTimeout(timers.current.leave);
    window.clearTimeout(timers.current.hover);
    timers.current.hover = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      const width = Math.max(r.width * 1.4, 340);
      const stageH = (width * 9) / 16;
      const h = stageH + 112;
      const left = Math.max(10, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 10));
      const top = Math.max(64, Math.min(r.top + r.height / 2 - stageH / 2, window.innerHeight - h - 10));
      setPop({ course: c, left, top, width });
    }, 320);
  }
  function leave() {
    window.clearTimeout(timers.current.hover);
    scheduleClose();
  }
  const openModal = (c: Course) => {
    closePop();
    setModal(c);
  };

  return (
    <>
      <Hero courses={heroes} onInfo={openModal} />

      <div className="mx-auto max-w-[1400px] px-4 pb-12">
        {controls}
        {rows.map((row) => (
          <Row key={row.key} row={row} onEnter={enter} onLeave={leave} onOpen={openModal} onScroll={closePop} />
        ))}
        {demo && (
          <p className="mt-10 max-w-[78ch] text-[12.5px] text-muted">
            Los programas, los creadores, las cifras y los testimonios de esta página son ejemplos mientras llegan los primeros
            creadores. Las portadas son ilustraciones y los trailers son videos de prueba.
          </p>
        )}
      </div>

      {pop && (
        <div
          className="lz-pop"
          style={{ left: pop.left, top: pop.top, width: pop.width }}
          onMouseEnter={() => window.clearTimeout(timers.current.leave)}
          onMouseLeave={scheduleClose}
          onClick={() => openModal(pop.course)}
        >
          <PopBody key={pop.course.id} course={pop.course} />
        </div>
      )}

      <dialog
        ref={dlgRef}
        className="lz-dlg"
        aria-label="Detalle del programa"
        onClose={() => setModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        {modal && (
          <ModalBody
            key={modal.id}
            course={modal}
            others={otherPrograms(rows, modal)}
            onSwitch={(c) => setModal(c)}
            onClose={() => setModal(null)}
          />
        )}
      </dialog>
    </>
  );
}

function otherPrograms(rows: FeedRow[], current: Course): Course[] {
  const seen = new Map<string, Course>();
  rows.forEach((r) => r.items.forEach((c) => c.id !== current.id && seen.set(c.id, c)));
  return [...seen.values()]
    .sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category) || b.rating - a.rating)
    .slice(0, 3);
}

/* ---------- billboard ---------- */
function Hero({ courses, onInfo }: { courses: Course[]; onInfo: (c: Course) => void }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const course = courses[idx];
  const hasVideo = Boolean(course.trailerUrl);
  const playing = videoPlaying && hasVideo;

  const fadeTo = useCallback(
    (i: number) => {
      setVisible(false);
      window.setTimeout(() => {
        setIdx(i);
        setVisible(true);
        setVideoPlaying(false);
      }, 450);
    },
    [],
  );

  // Auto-rotate every 10s
  useEffect(() => {
    if (courses.length <= 1) return;
    const t = window.setTimeout(() => fadeTo((idx + 1) % courses.length), 10_000);
    return () => window.clearTimeout(t);
  }, [idx, courses.length, fadeTo]);

  const transition = "opacity 0.45s ease";

  return (
    <section className={`lz-hero ${playing ? "is-playing" : ""}`} aria-label="Programa destacado">
      {/* fondo: portada / video */}
      <div className="lz-hero-bg" style={{ opacity: visible ? 1 : 0, transition }}>
        <StageLive
          key={course.id}
          course={course}
          active={visible}
          lockup={false}
          badges={false}
          onPlayingChange={setVideoPlaying}
        />
      </div>

      {/* overlay con copy */}
      <div
        className="lz-hero-copy"
        style={{ "--glow": course.art.glow, opacity: visible ? 1 : 0, transition } as React.CSSProperties}
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-end justify-between gap-6 px-6">
          <div className="lz-hero-in">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="rounded-full border border-white/25 px-3 py-0.5">{course.category}</span>
              <span className="font-bold text-good">{stars(course)}</span>
            </div>
            <h1>
              {course.art.lines.map((l, i) => (
                <span key={i} className={i === course.art.hl ? "hl" : undefined} style={{ display: "block" }}>
                  {l}
                </span>
              ))}
            </h1>
            <p className="lz-desc max-w-[44ch] text-[#dcdde8] [text-shadow:0_1px_12px_rgba(0,0,0,.7)]">
              {course.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`${programPath(course.slug)}?src=discover`}
                className="flex items-center gap-2 rounded-[10px] bg-white px-[22px] py-3 font-bold text-black"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                  <path d="M3 2l9 5-9 5V2z" />
                </svg>
                Ver {NOUN.one} · {formatPrice(course.priceCents, course.currency)}
              </Link>
              <button
                onClick={() => onInfo(course)}
                className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[rgba(120,124,150,.38)] px-[22px] py-3 font-bold backdrop-blur-sm"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
                </svg>
                Más información
              </button>
            </div>
          </div>

          {/* dots de rotación */}
          {courses.length > 1 && (
            <div className="lz-hero-dots">
              {courses.map((_, i) => (
                <button
                  key={i}
                  onClick={() => fadeTo(i)}
                  className={`lz-hero-dot${i === idx ? " active" : ""}`}
                  aria-label={`Ir al programa ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- filas ---------- */
function Row({
  row,
  onEnter,
  onLeave,
  onOpen,
  onScroll,
}: {
  row: FeedRow;
  onEnter: (el: HTMLElement, c: Course) => void;
  onLeave: () => void;
  onOpen: (c: Course) => void;
  onScroll: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ l: false, r: false });
  const updateEdges = useCallback(() => {
    const t = track.current;
    if (!t) return;
    const l = t.scrollLeft > 4;
    const r = t.scrollLeft + t.clientWidth < t.scrollWidth - 4;
    setEdges((p) => (p.l === l && p.r === r ? p : { l, r }));
  }, []);
  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);
  const scrollBy = (dir: number) => {
    const t = track.current;
    if (!t) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: dir * t.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <section className="lz-rowsec relative mt-6" aria-label={row.title}>
      <h2 className="mb-2 font-display text-xl font-bold tracking-tight">{row.title}</h2>
      <button className="lz-arr l" aria-label="Anterior" onClick={() => scrollBy(-1)}>
        ‹
      </button>
      <div
        className={`lz-track${edges.l ? " fade-l" : ""}${edges.r ? " fade-r" : ""}`}
        ref={track}
        onScroll={() => {
          updateEdges();
          onScroll();
        }}
      >
        {row.items.map((c) => (
          <button
            key={c.id}
            className="lz-card h"
            aria-label={`${c.title}, de ${c.creatorName}`}
            onClick={() => onOpen(c)}
            onMouseEnter={(e) => onEnter(e.currentTarget, c)}
            onMouseLeave={onLeave}
          >
            <Stage course={c} />
            <span className="lz-under">
              {c.creatorName} · {formatPrice(c.priceCents, c.currency)}
            </span>
          </button>
        ))}
      </div>
      <button className="lz-arr r" aria-label="Siguiente" onClick={() => scrollBy(1)}>
        ›
      </button>
    </section>
  );
}

/* ---------- tarjeta ampliada ---------- */
function PopBody({ course }: { course: Course }) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setLive(true), 650);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <>
      <StageLive course={course} active={live} />
      <div className="lz-pinfo">
        <div className="lz-pmeta">
          <span className="m">{stars(course)}</span>
          <span>{memberCount(course.members)}</span>
          {course.trailerSeconds > 0 && <span className="rounded border border-white/40 px-1.5 text-[11px]">{formatDuration(course.trailerSeconds)}</span>}
          <span>{formatPrice(course.priceCents, course.currency)}</span>
        </div>
        <div className="lz-ptags">
          {course.category} · {course.creatorName}
        </div>
      </div>
    </>
  );
}

/* ---------- detalle ---------- */
function ModalBody({
  course,
  others,
  onSwitch,
  onClose,
}: {
  course: Course;
  others: Course[];
  onSwitch: (c: Course) => void;
  onClose: () => void;
}) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setLive(true), 500);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <>
      <div className="relative">
        <button className="lz-x" aria-label="Cerrar" onClick={onClose}>
          ✕
        </button>
        <StageLive course={course} active={live} />
      </div>
      <div className="grid gap-[22px] px-6 pt-5 pb-6 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          <h2 className="font-display text-[26px] font-bold tracking-tight">{course.title}</h2>
          <div className="lz-pmeta mt-1.5">
            <span className="m">{stars(course)}</span>
            <span>{course.category}</span>
          </div>
          <p className="mt-2.5 text-[#cfd0da]">{course.description}</p>
          <p className="mt-2.5 text-[#cfd0da]">Incluye clases, comunidad con foro, calendario de sesiones en vivo y tabla de posiciones.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href={`${programPath(course.slug)}?src=discover`} className="rounded-[10px] bg-accent px-[22px] py-3 font-bold text-accent-ink">
              Ver {NOUN.one} · {formatPrice(course.priceCents, course.currency)}
            </Link>
          </div>
        </div>
        <div className="grid content-start gap-1.5 text-[13px] text-muted">
          <div>
            Creador: <b className="text-fg">{course.creatorName}</b>
          </div>
          <div>
            Miembros: <b className="text-fg">{course.members.toLocaleString("es-US")}</b>
          </div>
          <div>
            Trailer: <b className="text-fg">{course.trailerSource === "ai" ? "generado con IA" : "del creador"}</b>
          </div>
          <div>Pago único, sin suscripción</div>
        </div>
      </div>
      {others.length > 0 && (
        <div className="lz-more grid grid-cols-3 gap-2 px-6 pb-6">
          {others.map((o) => (
            <button key={o.id} className="border-0 bg-transparent p-0" aria-label={o.title} onClick={() => onSwitch(o)}>
              <Stage course={o} badges={false} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
