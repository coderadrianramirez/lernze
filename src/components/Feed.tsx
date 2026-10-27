"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { NOUN, memberCount, programPath } from "@/lib/copy";
import { formatDuration, formatPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";
import { Stage } from "./Stage";
import { Scene, StageLive } from "./StageLive";

export type FeedRow = { key: string; title: string; items: Course[] };

type Props = {
  hero: Course;
  rows: FeedRow[];
  fmt: "h" | "v";
  /** Controles entre el billboard y las filas (intereses y formato). */
  controls: ReactNode;
  demo: boolean;
};

const IC = {
  play: <svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" /></svg>,
  down: <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>,
};

const stars = (c: Course) => (c.rating > 0 ? `★ ${c.rating.toFixed(1)}` : "Nuevo");

export function Feed({ hero, rows, fmt, controls, demo }: Props) {
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
      <Hero course={hero} onInfo={() => openModal(hero)} />

      <div className="mx-auto max-w-[1400px] px-4 pb-12">
        {controls}
        {rows.map((row) => (
          <Row key={row.key} row={row} fmt={fmt} onEnter={enter} onLeave={leave} onOpen={openModal} onScroll={closePop} />
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
          <PopBody key={pop.course.id} course={pop.course} onOpen={() => openModal(pop.course)} />
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
function Hero({ course, onInfo }: { course: Course; onInfo: () => void }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [scene, setScene] = useState<number | null>(null);
  const hasVideo = Boolean(course.trailerUrl);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setActive(true), 1100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className={`lz-hero ${playing ? "is-playing" : ""} ${hasVideo ? "has-video" : ""}`} aria-label="Programa destacado">
      <StageLive course={course} active={active} lockup={false} badges={false} onPlayingChange={setPlaying} onScene={setScene} />
      <div className="lz-hero-copy" style={{ "--glow": course.art.glow } as React.CSSProperties}>
        <div className="mx-auto w-full max-w-[1400px] px-4">
          <div className="lz-hero-in">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className={`lz-b ${course.trailerSource === "ai" ? "ai" : "cr"}`}>
                {course.trailerSource === "ai" ? "Trailer IA" : "Trailer del creador"}
              </span>
              <span>{course.category}</span>
              <span className="font-bold text-good">{stars(course)}</span>
            </div>
            <div className="lz-tbox">
              <h1>
                {course.art.lines.map((l, i) => (
                  <span key={i} className={i === course.art.hl ? "hl" : undefined} style={{ display: "block" }}>
                    {l}
                  </span>
                ))}
              </h1>
              {!hasVideo && (
                <div className="lz-hcaps" aria-hidden="true">
                  {scene !== null && <Scene key={scene} course={course} i={scene} />}
                </div>
              )}
            </div>
            <p className="lz-desc max-w-[46ch] text-[#e3e3ea] [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">{course.description}</p>
            <div className="flex flex-wrap gap-2.5">
              <Link href={`${programPath(course.slug)}?src=discover`} className="rounded-[10px] bg-accent px-[22px] py-3 font-bold text-accent-ink">
                Ver {NOUN.one} · {formatPrice(course.priceCents, course.currency)}
              </Link>
              <button
                onClick={onInfo}
                className="cursor-pointer rounded-[10px] bg-[rgba(120,124,150,.4)] px-[22px] py-3 font-bold backdrop-blur-sm"
              >
                Más información
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- filas ---------- */
function Row({
  row,
  fmt,
  onEnter,
  onLeave,
  onOpen,
  onScroll,
}: {
  row: FeedRow;
  fmt: "h" | "v";
  onEnter: (el: HTMLElement, c: Course) => void;
  onLeave: () => void;
  onOpen: (c: Course) => void;
  onScroll: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
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
      <div className="lz-track" ref={track} onScroll={onScroll}>
        {row.items.map((c) => (
          <button
            key={c.id}
            className={`lz-card ${fmt}`}
            aria-label={`${c.title}, de ${c.creatorName}`}
            onClick={() => onOpen(c)}
            onMouseEnter={(e) => onEnter(e.currentTarget, c)}
            onMouseLeave={onLeave}
          >
            <Stage course={c} mode={fmt} />
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
function PopBody({ course, onOpen }: { course: Course; onOpen: () => void }) {
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
        <div className="lz-pbtns">
          <button
            className="lz-circ play"
            aria-label={`Ver ${NOUN.one}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {IC.play}
          </button>
          <button
            className="lz-circ more"
            aria-label="Más información"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {IC.down}
          </button>
        </div>
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
