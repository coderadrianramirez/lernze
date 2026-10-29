import React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { Feed, type FeedRow } from "@/components/Feed";
import { NOUN } from "@/lib/copy";
import { listCourses, rankForInterests, getUserInterests } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
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
  const query = typeof sp.q === "string" ? sp.q.trim() : "";

  // Intereses: URL param tiene prioridad (filtro manual); si no, cargamos desde DB
  const urlInterests = parseInterests(sp.i);
  const [allCourses, user] = await Promise.all([listCourses(), getCurrentUser()]);

  // Intereses persistidos del usuario (null = onboarding pendiente, [] = no eligió)
  const dbInterests = user && !user.demo ? await getUserInterests(user.id) : null;

  // Intereses activos: URL > DB > []
  const activeInterests: Category[] = urlInterests.length
    ? urlInterests
    : (dbInterests ?? []).filter((x): x is Category => (CATEGORIES as string[]).includes(x));

  // Onboarding pendiente: usuario logueado, nunca completó, y no viene de URL
  const needsOnboarding = user && !user.demo && dbInterests === null && !urlInterests.length;

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
            heroes={results.slice(0, 1)}
            rows={[{ key: "resultados", title: `Resultados para "${query}"`, items: results }]}
            controls={null}
            demo={results.some((c) => c.demo)}
          />
        )}
      </div>
    );
  }

  // Algoritmo: cursos rankeados por intereses del usuario
  const hasInterests = activeInterests.length > 0;
  const forYou = hasInterests ? rankForInterests(allCourses, activeInterests) : [];
  const trending = [...allCourses].sort((a, b) => b.members - a.members).slice(0, 8);
  const rated = [...allCourses].filter((c) => c.rating > 0).sort((a, b) => b.rating - a.rating || b.members - a.members);
  const cheap = allCourses.filter((c) => c.priceCents < 10_000).sort((a, b) => a.priceCents - b.priceCents);

  // Hero: si tiene intereses, prioriza los cursos "Para ti"; sino top trending
  const heroPool = hasInterests ? forYou.slice(0, 5) : trending.slice(0, 5);
  const heroes = heroPool.length ? heroPool : allCourses.slice(0, 5);

  // Filas que cambian según intereses del algoritmo
  const forYouRow: FeedRow[] = hasInterests
    ? [{ key: "para-ti", title: "Para ti", items: forYou }]
    : [];

  // Filas "Porque te interesa X" — una por categoría activa con suficientes cursos
  const interestRows: FeedRow[] = activeInterests
    .map((cat) => {
      const items = allCourses.filter((c) => c.category === cat).sort((a, b) => b.rating - a.rating || b.members - a.members);
      return items.length >= 2 ? { key: `cat-${cat}`, title: `Porque te interesa ${cat}`, items } : null;
    })
    .filter((r): r is FeedRow => r !== null);

  const rows: FeedRow[] = [
    ...forYouRow,
    { key: "tendencia", title: "Tendencia esta semana", items: trending },
    ...interestRows,
    ...(rated.length ? [{ key: "valorados", title: "Mejor valorados", items: rated }] : []),
    ...(cheap.length ? [{ key: "baratos", title: "Por menos de $100", items: cheap }] : []),
  ];

  // Strip contextual debajo del hero según estado del usuario
  let controls: React.ReactNode = null;
  if (!user || user.demo) {
    controls = (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-3.5">
        <p className="text-sm text-muted">
          Descubrí cursos adaptados a lo que querés aprender.
        </p>
        <Link
          href="/registro"
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90"
        >
          Crear cuenta gratis →
        </Link>
      </div>
    );
  } else if (needsOnboarding) {
    controls = (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-accent/30 bg-accent/5 px-5 py-3.5">
        <p className="text-sm text-fg">
          Elegí tus temas y personalizamos el feed para vos.
        </p>
        <Link
          href="/bienvenida"
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90"
        >
          Elegir temas →
        </Link>
      </div>
    );
  }

  return (
    <Feed
      key={`feed|${activeInterests.join(",")}`}
      heroes={heroes}
      rows={rows}
      controls={controls}
      demo={allCourses.some((c) => c.demo)}
    />
  );
}
