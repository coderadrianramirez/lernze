import Link from "next/link";
import type { CSSProperties } from "react";
import { NOUN } from "@/lib/copy";
import { CATEGORY_META } from "@/lib/categories";
import { CATEGORIES } from "@/lib/types";

const CATS = CATEGORIES.map((name) => ({ name, ...CATEGORY_META[name] }));

const STEPS = [
  { t: "Sube tu trailer", d: `Un video corto que cuente qué aprende quien entra a tu ${NOUN.one}.` },
  { t: "Lernze lo muestra", d: "Tu trailer aparece en el Discover frente a personas interesadas en tu tema." },
  { t: "Crece tu comunidad", d: "Cobras con pago único y tus alumnos se suman a tu foro y sesiones en vivo." },
];

export function EmptyFeed() {
  return (
    <div className="lz-empty">
      <section className="lz-empty-hero">
        <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-semibold text-muted">
              <span className="lz-empty-dot" aria-hidden />
              Lernze está abriendo sus puertas
            </span>
            <h1 className="mt-6 font-display text-[clamp(36px,5.2vw,68px)] leading-[0.98] font-extrabold tracking-tight text-balance">
              El primer {NOUN.one} del Discover puede ser <span className="text-accent">el tuyo.</span>
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[#cfd0da]">
              {`Convierte lo que sabes en un trailer que se ve aquí. Publica tu ${NOUN.one} y empieza a sumar alumnos a tu comunidad.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/crear"
                className="rounded-xl bg-accent px-6 py-3.5 font-bold text-accent-ink shadow-[0_12px_36px_-12px_var(--color-accent)] transition hover:brightness-110"
              >
                {`Publicar mi ${NOUN.one}`}
              </Link>
              <Link
                href="/registro"
                className="rounded-xl border border-line px-6 py-3.5 font-semibold text-fg transition-colors hover:border-fg/30"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          {/* vista previa del feed */}
          <div className="lz-empty-preview" aria-hidden>
            {CATS.slice(0, 3).map((c, i) => (
              <div key={c.name} className={`lz-empty-card c${i}`} style={{ "--glow": c.glow } as CSSProperties}>
                <span className="lz-empty-tag">Trailer del creador</span>
                <svg className="lz-empty-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={c.icon} />
                </svg>
                <div className="lz-empty-lines">
                  <b>{i === 0 ? "Tu trailer aquí" : c.name}</b>
                  <i />
                  <i />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">Así funciona</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-2xl border border-line bg-surface p-6">
              <span className="font-display text-4xl font-extrabold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-4 font-display text-lg font-bold">{s.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight">Buscamos creadores de</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATS.map((c) => (
            <li key={c.name} className="lz-empty-cat" style={{ "--glow": c.glow } as CSSProperties}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={c.icon} />
              </svg>
              <p className="mt-4 font-semibold text-fg">{c.name}</p>
              <p className="text-xs text-muted">{c.hint}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
