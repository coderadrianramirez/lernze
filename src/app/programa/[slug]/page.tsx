import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Stage } from "@/components/Stage";
import { StageLive } from "@/components/StageLive";
import { NOUN, cap, memberCount, programPath } from "@/lib/copy";
import { getCourseBySlug, listCourses } from "@/lib/data";
import { COMMISSION_BPS, formatPrice, parseOrigin } from "@/lib/pricing";
import { enrollAction } from "./actions";
import { ShareButtons } from "./ShareButtons";

export async function generateMetadata({ params }: PageProps<"/programa/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course?.title ?? cap(NOUN.one) };
}

export default function CoursePage({ params, searchParams }: PageProps<"/programa/[slug]">) {
  return (
    <main className="mx-auto max-w-[1400px] px-5 pt-6 pb-32 md:pb-16">
      <Suspense fallback={<div className="mt-4 aspect-video animate-pulse rounded-2xl bg-surface" aria-label="Cargando" />}>
        <CourseDetail params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const INCLUDES = [
  { t: "Clases a tu ritmo", d: "Lecciones en video, disponibles siempre", icon: "M8 5v14l11-7z" },
  { t: "Comunidad y foro", d: "Preguntá y compartí con otros alumnos", icon: "M4 5h16v10H8l-4 4z" },
  { t: "Sesiones en vivo", d: "Calendario de encuentros con el creador", icon: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
  { t: "Tabla de posiciones", d: "Sumá puntos a medida que avanzás", icon: "M6 20V10M12 20V4M18 20v-7" },
];

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-accent" aria-label={`${rating.toFixed(1)} de 5`}>
      {"★★★★★".slice(0, full)}
      <span className="text-line">{"★★★★★".slice(full)}</span>
    </span>
  );
}

async function CourseDetail({
  params,
  searchParams,
}: {
  params: PageProps<"/programa/[slug]">["params"];
  searchParams: PageProps<"/programa/[slug]">["searchParams"];
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [course, all] = await Promise.all([getCourseBySlug(slug), listCourses()]);
  if (!course) notFound();

  const origin = parseOrigin(sp.src);
  const done = sp.ok === "1";
  const price = formatPrice(course.priceCents, course.currency);
  const initials = course.creatorName
    .replace(/^(Prof\.|Dr\.|Dra\.|Lic\.)\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const others = all.filter((c) => c.id !== course.id);
  const recommended = [
    ...others.filter((c) => c.category === course.category),
    ...others.filter((c) => c.category !== course.category).sort((a, b) => b.members - a.members),
  ].slice(0, 6);

  const cta = (className: string) =>
    done ? (
      <p role="status" className="rounded-xl bg-good/15 p-3 text-sm text-good">
        Listo, quedaste inscrito en este {NOUN.one} (simulado).
      </p>
    ) : (
      <form action={enrollAction}>
        <input type="hidden" name="slug" value={course.slug} />
        <input type="hidden" name="origin" value={origin} />
        <button
          className={`w-full cursor-pointer rounded-xl bg-accent font-bold text-accent-ink shadow-[0_10px_34px_-10px_var(--color-accent)] transition hover:brightness-110 active:scale-[0.98] ${className}`}
        >
          Entrar a la comunidad
        </button>
      </form>
    );

  return (
    <>
      {/* ruta */}
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-fg">Inicio</Link>
        <span aria-hidden>/</span>
        <Link href={`/?i=${encodeURIComponent(course.category)}`} className="hover:text-fg">{course.category}</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-fg">{course.title}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* columna principal */}
        <div className="min-w-0">
          <div className="lz-detail">
            <StageLive course={course} active controls />
          </div>

          <div className="mt-7 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(28px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-tight text-balance">
                {course.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="rounded-full border border-line px-3 py-0.5">{course.category}</span>
                {course.rating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Stars rating={course.rating} />
                    <b className="text-fg">{course.rating.toFixed(1)}</b>
                  </span>
                )}
                <span>{memberCount(course.members)}</span>
                <span>por <b className="text-fg">{course.creatorName}</b></span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-bold">Sobre este {NOUN.one}</h2>
            <p className="mt-3 max-w-[70ch] text-[16px] leading-relaxed text-[#cfd0da]">
              {course.description || `Este ${NOUN.one} aún no tiene descripción.`}
            </p>
            <p className="mt-3 max-w-[70ch] leading-relaxed text-[#cfd0da]">
              Incluye clases, comunidad con foro, calendario de sesiones en vivo y tabla de posiciones.
            </p>
          </div>

          {/* creador */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">Tu creador</h2>
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-xl font-extrabold text-ink"
                style={{ background: course.art.glow }}
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold">{course.creatorName}</p>
                <p className="text-sm text-muted">
                  Creador de {course.title} · {course.category}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* columna lateral */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="lz-poster mx-auto w-[190px]">
              <Stage course={course} mode="v" badges={false} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                {course.rating > 0 ? (
                  <>
                    <Stars rating={course.rating} />
                    <p className="mt-0.5 text-xs text-muted">{memberCount(course.members)}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted">Nuevo</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Acceso completo</p>
                <p className="font-display text-[40px] leading-none font-extrabold">{price}</p>
              </div>
            </div>
            <div className="mt-5">{cta("px-4 py-4 text-lg")}</div>
            <p className="mt-3 text-center text-xs text-muted">Pago único. Compra simulada: todavía no se cobra.</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-bold">Qué incluye</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {INCLUDES.map((it) => (
                <li key={it.t} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={it.icon} />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{it.t}</p>
                    <p className="text-xs text-muted">{it.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-bold">Compartir</h2>
            <div className="mt-3">
              <ShareButtons title={course.title} />
            </div>
          </div>

          <p className="px-1 text-xs text-muted">
            Origen de esta visita: {origin === "discover" ? "Discover" : origin === "agent" ? "clip de un agente" : "tráfico propio"}
            . Comisión de Lernze: {COMMISSION_BPS[origin] / 100}%.
          </p>
        </aside>
      </div>

      {/* recomendados */}
      {recommended.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold tracking-tight">Recomendados para ti</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recommended.map((c) => (
              <Link key={c.id} href={`${programPath(c.slug)}?src=discover`} className="group">
                <div className="lz-poster transition-transform group-hover:-translate-y-1">
                  <Stage course={c} mode="v" badges={false} />
                </div>
                <p className="mt-2 truncate text-sm font-semibold group-hover:text-accent">{c.title}</p>
                <p className="text-xs text-muted">
                  {c.category} · {formatPrice(c.priceCents, c.currency)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* móvil: precio y CTA siempre visibles */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <div className="font-display text-2xl leading-none font-extrabold">{price}</div>
            <p className="mt-1 text-[11px] text-muted">Pago único</p>
          </div>
          <div className="flex-1">{cta("px-4 py-3.5")}</div>
        </div>
      </div>
    </>
  );
}
