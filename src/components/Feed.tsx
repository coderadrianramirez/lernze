"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { NOUN, memberCount, programPath } from "@/lib/copy";
import { formatDuration, formatPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";
import { Stage } from "./Stage";
import { StageLive } from "./StageLive";

export type FeedRow = {
  key: string;
  title: string;
  items: Course[];
  reason?: string;
  layout?: "grid" | "top";
  more?: { href: string; label: string };
};

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
        {rows.map((row) =>
          row.layout === "grid" ? (
            <GridRow key={row.key} row={row} onOpen={openModal} />
          ) : row.layout === "top" ? (
            <TopRow key={row.key} row={row} onOpen={openModal} />
          ) : (
            <Row key={row.key} row={row} onEnter={enter} onLeave={leave} onOpen={openModal} onScroll={closePop} />
          ),
        )}
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

/* ---------- título de fila ---------- */
function RowHead({ row }: { row: FeedRow }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h2 className="font-display text-xl font-bold tracking-tight">{row.title}</h2>
      {row.reason && (
        <span className="lz-why">
          <button type="button" aria-label="¿Por qué ves esto?" aria-describedby={`why-${row.key}`}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 7.2v3.8M8 5v.4" strokeLinecap="round" />
            </svg>
          </button>
          <span role="tooltip" id={`why-${row.key}`}>
            <b>¿Por qué ves esto?</b>
            {row.reason}
          </span>
        </span>
      )}
      {row.more && (
        <Link
          href={row.more.href}
          className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
        >
          {row.more.label}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="8" cy="8" r="6.5" />
            <path d="M7 5.5 9.5 8 7 10.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}

/* ---------- grilla destacada ---------- */
function GridRow({ row, onOpen }: { row: FeedRow; onOpen: (c: Course) => void }) {
  const items = row.items.slice(0, 5);
  return (
    <section className="relative mt-8" aria-label={row.title}>
      <RowHead row={row} />
      <div className="lz-bento">
        {items.map((c, i) => (
          <button
            key={c.id}
            className={`lz-bento-cell${i === 0 ? " big" : ""}`}
            aria-label={`${c.title}, de ${c.creatorName}, ${formatPrice(c.priceCents, c.currency)}`}
            onClick={() => onOpen(c)}
          >
            <Stage course={c} badges={false} />
            <span className="lz-bento-price">{formatPrice(c.priceCents, c.currency)}</span>
            {i === 0 && (
              <span className="lz-bento-meta">
                <span className="lz-bento-play" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M3 2l9 5-9 5V2z" />
                  </svg>
                </span>
                {c.category} · {c.creatorName} · {stars(c)}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- top 5 con pestañas ---------- */
function TopRow({ row, onOpen }: { row: FeedRow; onOpen: (c: Course) => void }) {
  const [cat, setCat] = useState<string>("all");
  const [sel, setSel] = useState(0);
  const cats = [...new Set(row.items.map((c) => c.category))];
  const list = (cat === "all" ? row.items : row.items.filter((c) => c.category === cat)).slice(0, 5);
  const current = list[sel] ?? list[0];
  if (!current) return null;

  const pick = (c: string) => {
    setCat(c);
    setSel(0);
  };
  const tab = (on: boolean) =>
    `whitespace-nowrap text-sm transition-colors ${on ? "font-semibold text-fg" : "text-muted hover:text-fg"}`;

  return (
    <section className="relative mt-10" aria-label={row.title}>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <RowHead row={{ ...row, more: undefined }} />
        <div className="ml-auto flex items-center gap-5 overflow-x-auto" role="tablist" aria-label="Filtrar por categoría">
          <button role="tab" aria-selected={cat === "all"} className={tab(cat === "all")} onClick={() => pick("all")}>
            Todas
          </button>
          {cats.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={tab(cat === c)} onClick={() => pick(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="lz-top">
        {/* portadas del seleccionado */}
        <div className="lz-top-art" key={current.id}>
          <div className="lz-top-col">
            <button className="lz-top-tile" onClick={() => onOpen(current)} aria-label={`Ver ${current.title}`}>
              <Stage course={current} lockup={false} badges={false} />
            </button>
            <div className="lz-top-tile lz-top-text" style={{ "--glow": current.art.glow } as React.CSSProperties}>
              <p className="font-display text-[clamp(18px,1.6vw,24px)] leading-tight font-extrabold uppercase">
                {current.title}
              </p>
              <p className="mt-2 line-clamp-2 text-[13px] text-[#cfd0da]">{current.description}</p>
            </div>
            <div className="lz-top-tile lz-top-cta">
              <Link
                href={`${programPath(current.slug)}?src=discover`}
                className="flex items-center justify-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink"
              >
                Ver {NOUN.one} · {formatPrice(current.priceCents, current.currency)}
              </Link>
              <button
                onClick={() => onOpen(current)}
                className="cursor-pointer rounded-[10px] border border-line px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-fg"
              >
                Más información
              </button>
            </div>
          </div>
          <button className="lz-top-poster" onClick={() => onOpen(current)} aria-label={`Ver ${current.title}`}>
            <Stage course={current} mode="v" badges={false} />
          </button>
        </div>

        {/* ranking */}
        <ol className="flex flex-col gap-2.5">
          {list.map((c, i) => {
            const on = c.id === current.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSel(i)}
                  onDoubleClick={() => onOpen(c)}
                  aria-current={on ? "true" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-5 rounded-xl px-6 text-left transition-colors ${
                    on ? "bg-surface-2 py-5 shadow-[inset_3px_0_0_var(--color-accent)]" : "bg-surface py-3.5 hover:bg-surface-2"
                  }`}
                >
                  <span className={`w-10 shrink-0 font-display text-2xl font-extrabold ${on ? "text-accent" : "text-fg"}`}>
                    #{i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.title}</span>
                    {on && (
                      <>
                        <span className="mt-1 block text-xs text-muted">
                          {c.category} · {c.creatorName}
                        </span>
                        <span className="mt-2 flex items-center gap-3 text-xs text-muted">
                          <span className="text-sm text-accent">
                            {"★★★★★".slice(0, Math.round(c.rating))}
                            <span className="text-line">{"★★★★★".slice(Math.round(c.rating))}</span>
                          </span>
                          {memberCount(c.members)}
                        </span>
                      </>
                    )}
                  </span>
                  {on && (
                    <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-accent-ink">
                      {formatPrice(c.priceCents, c.currency)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
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
      <RowHead row={row} />
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
