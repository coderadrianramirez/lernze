import Link from "next/link";
import { Suspense } from "react";
import { Rail, TrailerCard } from "@/components/TrailerCard";
import { listCourses, rankForInterests } from "@/lib/data";
import { NOUN, programPath } from "@/lib/copy";
import { formatPrice } from "@/lib/pricing";
import { CATEGORIES, type Category } from "@/lib/types";

function parseInterests(raw: string | string[] | undefined): Category[] {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return [];
  return v.split(",").filter((x): x is Category => (CATEGORIES as string[]).includes(x));
}

export default function Discover({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto max-w-[1180px] px-4 pt-5 pb-12">
      <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-2xl bg-surface" aria-label="Cargando" />}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Feed({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const interests = parseInterests(sp.i);
  const courses = await listCourses();

  const forYou = rankForInterests(courses, interests);
  const trending = [...courses].sort((a, b) => b.members - a.members).slice(0, 6);
  const short = courses.filter((c) => c.trailerSeconds > 0 && c.trailerSeconds <= 105);
  const cheap = courses.filter((c) => c.priceCents < 10_000).sort((a, b) => a.priceCents - b.priceCents);
  const hero = forYou[0] ?? trending[0];

  if (courses.length === 0) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-8 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{`Aún no hay ${NOUN.other} publicados`}</h1>
        <p className="mx-auto mt-2 max-w-[48ch] text-muted">
          {`El Discover feed se llena con los ${NOUN.other} de los creadores.`} Publica el primero y aparecerá aquí con su trailer.
        </p>
        <Link href="/crear" className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink">
          {`Publicar un ${NOUN.one}`}
        </Link>
      </section>
    );
  }

  const toggle = (cat: Category) => {
    const next = interests.includes(cat) ? interests.filter((c) => c !== cat) : [...interests, cat];
    return next.length ? `/?i=${next.join(",")}` : "/";
  };

  return (
    <>
      {hero && (
        <section
          className="relative flex min-h-[320px] items-end overflow-hidden rounded-2xl"
          style={{ background: `linear-gradient(120deg, ${hero.palette[0]}, ${hero.palette[1]})` }}
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(255,181,71,.3),transparent_45%),linear-gradient(0deg,rgba(13,14,20,.92),rgba(13,14,20,.15)_65%)]" />
          <div className="relative grid max-w-[640px] gap-3 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full bg-white/10 px-2.5 py-1 font-medium ${hero.trailerSource === "ai" ? "text-ai" : "text-accent"}`}>
                {hero.trailerSource === "ai" ? "Trailer generado con IA" : "Trailer del creador"}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">{hero.category}</span>
            </div>
            <h1 className="font-display text-[clamp(30px,5vw,48px)] leading-[1.05] font-extrabold tracking-tight text-balance">
              {hero.title}
            </h1>
            <p className="text-[#d4d5de]">{hero.description}</p>
            <div>
              <Link
                href={`${programPath(hero.slug)}?src=discover`}
                className="inline-block rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink"
              >
                Ver {NOUN.one} · {formatPrice(hero.priceCents, hero.currency)}
              </Link>
            </div>
          </div>
        </section>
      )}

      <div role="group" aria-label="Tus intereses" className="scrollbar-thin mt-5 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="mr-1 text-[13px] whitespace-nowrap text-muted">Tus intereses</span>
        {CATEGORIES.map((cat) => {
          const on = interests.includes(cat);
          return (
            <Link
              key={cat}
              href={toggle(cat)}
              aria-current={on ? "true" : undefined}
              scroll={false}
              className={`rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap ${
                on ? "border-accent bg-accent font-bold text-accent-ink" : "border-line bg-surface text-muted hover:text-fg"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {forYou.length > 0 && (
        <Rail title="Para ti" subtitle={`Según ${interests.join(" y ").toLowerCase()}`}>
          {forYou.map((c) => (
            <TrailerCard key={c.id} course={c} why={`Porque te interesa ${c.category.toLowerCase()}`} />
          ))}
        </Rail>
      )}
      {forYou.length === 0 && (
        <p className="mt-6 text-sm text-muted">Elige uno o más intereses para armar tu fila &ldquo;Para ti&rdquo;.</p>
      )}

      <Rail title="Tendencia esta semana" subtitle="Lo que más se inscribe ahora">
        {trending.map((c) => (
          <TrailerCard key={c.id} course={c} why={`${c.members.toLocaleString("es")} personas ya están dentro`} />
        ))}
      </Rail>
      <Rail title="Trailers cortos" subtitle="Para decidir en un minuto">
        {short.map((c) => (
          <TrailerCard key={c.id} course={c} />
        ))}
      </Rail>
      <Rail title="Por menos de $100" subtitle="Entra hoy y empieza esta noche">
        {cheap.map((c) => (
          <TrailerCard key={c.id} course={c} />
        ))}
      </Rail>
    </>
  );
}
