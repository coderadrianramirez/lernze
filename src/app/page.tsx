import Link from "next/link";
import { Suspense } from "react";
import { Feed, type FeedRow } from "@/components/Feed";
import { NOUN } from "@/lib/copy";
import { listCourses, rankForInterests } from "@/lib/data";
import { CATEGORIES, type Category } from "@/lib/types";

function parseInterests(raw: string | string[] | undefined): Category[] {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return [];
  return v.split(",").filter((x): x is Category => (CATEGORIES as string[]).includes(x));
}

function categoryHref(interests: Category[]) {
  const p = new URLSearchParams();
  if (interests.length) p.set("i", interests.join(","));
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

function filterByQuery(courses: Awaited<ReturnType<typeof listCourses>>, q: string) {
  const lower = q.toLowerCase();
  return courses.filter(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      c.creatorName.toLowerCase().includes(lower) ||
      c.category.toLowerCase().includes(lower),
  );
}

export default function Discover({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <Suspense fallback={<div className="h-[420px] animate-pulse bg-surface" aria-label="Cargando" />}>
        <Page searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Page({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const interests = parseInterests(sp.i);
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const allCourses = await listCourses();

  if (allCourses.length === 0) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 pt-5">
        <section className="rounded-2xl border border-line bg-surface p-12 text-center">
          <p className="font-display text-5xl font-extrabold tracking-tight">
            lernze<span className="text-accent">.</span>
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
            {`Aún no hay ${NOUN.other} publicados`}
          </h1>
          <p className="mx-auto mt-2 max-w-[44ch] text-muted">
            {`El Discover feed se llena con los ${NOUN.other} de los creadores. Publica el primero y aparecerá aquí con su trailer.`}
          </p>
          <Link
            href="/registro"
            className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-bold text-accent-ink transition-opacity hover:opacity-90"
          >
            {`Publicar un ${NOUN.one}`}
          </Link>
        </section>
      </div>
    );
  }

  // Resultados de búsqueda
  if (query) {
    const results = filterByQuery(allCourses, query);
    return (
      <div className="mx-auto max-w-[1180px] px-4 pt-6">
        <p className="mb-4 text-sm text-muted">
          {results.length > 0
            ? `${results.length} resultado${results.length !== 1 ? "s" : ""} para "${query}"`
            : `Sin resultados para "${query}"`}
        </p>
        {results.length === 0 ? (
          <section className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-muted">Prueba con otro nombre o categoría.</p>
          </section>
        ) : (
          <Feed
            key={`search|${query}`}
            hero={results[0]}
            rows={[{ key: "resultados", title: `Resultados para "${query}"`, items: results }]}
            controls={null}
            demo={results.some((c) => c.demo)}
          />
        )}
      </div>
    );
  }

  const courses = interests.length ? rankForInterests(allCourses, interests) : allCourses;
  const trending = [...allCourses].sort((a, b) => b.members - a.members).slice(0, 8);
  const rated = [...allCourses].filter((c) => c.rating > 0).sort((a, b) => b.rating - a.rating || b.members - a.members);
  const cheap = allCourses.filter((c) => c.priceCents < 10_000).sort((a, b) => a.priceCents - b.priceCents);
  const hero = courses[0] ?? trending[0];

  const rows: FeedRow[] = [
    ...(interests.length ? [{ key: "para-ti", title: "Para ti", items: courses }] : []),
    { key: "tendencia", title: "Tendencia esta semana", items: trending },
    ...(rated.length ? [{ key: "valorados", title: "Mejor valorados", items: rated }] : []),
    ...(cheap.length ? [{ key: "baratos", title: "Por menos de $100", items: cheap }] : []),
  ];

  const toggle = (cat: Category) =>
    categoryHref(interests.includes(cat) ? interests.filter((c) => c !== cat) : [...interests, cat]);

  const controls = (
    <div className="mt-4">
    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
      {interests.length > 0 ? "Tus intereses" : "Categorías"}
    </p>
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {CATEGORIES.map((cat) => {
        const on = interests.includes(cat);
        return (
          <Link
            key={cat}
            href={toggle(cat)}
            aria-current={on ? "true" : undefined}
            scroll={false}
            className={`rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors ${
              on
                ? "border-accent bg-accent font-bold text-accent-ink"
                : "border-line bg-surface text-muted hover:border-fg/20 hover:text-fg"
            }`}
          >
            {cat}
          </Link>
        );
      })}
    </div>
    </div>
  );

  return (
    <Feed
      key={`feed|${interests.join(",")}`}
      hero={hero}
      rows={rows}
      controls={controls}
      demo={allCourses.some((c) => c.demo)}
    />
  );
}
