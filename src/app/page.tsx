import { Suspense } from "react";
import { EmptyFeed } from "@/components/EmptyFeed";
import { Feed, type FeedRow } from "@/components/Feed";
import { NOUN, cap } from "@/lib/copy";
import { listCourses, rankForInterests, getUserInterests } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, type Category } from "@/lib/types";

function parseInterests(raw: string | string[] | undefined): Category[] {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return [];
  return v.split(",").filter((x): x is Category => (CATEGORIES as string[]).includes(x));
}

function joinEs(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
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

  if (allCourses.length === 0) return <EmptyFeed />;

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
  // Sin intereses: toda la plataforma. Con intereses: solo sus temas.
  const pool = hasInterests ? forYou : allCourses;
  const trending = [...pool].sort((a, b) => b.members - a.members).slice(0, 8);
  const cheap = pool.filter((c) => c.priceCents < 10_000).sort((a, b) => a.priceCents - b.priceCents);

  // Hero: si tiene intereses, prioriza los cursos "Para ti"; sino top trending
  const heroPool = hasInterests ? forYou.slice(0, 5) : trending.slice(0, 5);
  const heroes = heroPool.length ? heroPool : allCourses.slice(0, 5);

  // Filas que cambian según intereses del algoritmo
  const personal = Boolean(user && !user.demo && dbInterests?.length);
  const label = joinEs(activeInterests);
  const forYouRow: FeedRow[] = hasInterests
    ? [
        {
          key: "para-ti",
          title: personal ? "Para ti" : "Destacados",
          items: forYou,
          reason: personal
            ? `Según los temas que elegiste (${label}). Primero van los mejor calificados por sus alumnos.`
            : `Los ${NOUN.other} de ${label} con mejor calificación de sus alumnos.`,
        },
      ]
    : [];

  // Filas "Porque te interesa X" — una por categoría activa con suficientes cursos
  const interestRows: FeedRow[] = activeInterests
    .map((cat): FeedRow | null => {
      const items = allCourses.filter((c) => c.category === cat).sort((a, b) => b.rating - a.rating || b.members - a.members);
      return items.length >= 2
        ? {
            key: `cat-${cat}`,
            title: `Porque te interesa ${cat}`,
            items,
            reason: `Todo lo que hay de ${cat}, uno de los temas que elegiste al crear tu cuenta.`,
          }
        : null;
    })
    .filter((r): r is FeedRow => r !== null);

  const allRows: FeedRow[] = [
    ...forYouRow,
    {
      key: "tendencia",
      title: "Los más elegidos",
      items: trending,
      reason: hasInterests
        ? `Los ${NOUN.other} de ${label} que más alumnos eligieron.`
        : `Los ${NOUN.other} que más alumnos eligieron en Lernze.`,
    },
    ...interestRows,
    ...(cheap.length
      ? [
          {
            key: "ofertas",
            title: "Por menos de $100",
            items: cheap,
            reason: hasInterests
              ? `${cap(NOUN.other)} de ${label} con pago único menor a $100.`
              : `${cap(NOUN.other)} completos con pago único menor a $100, para empezar sin gastar mucho.`,
            layout: "grid" as const,
            more: { href: "/ofertas", label: "Ver todas" },
          },
        ]
      : []),
  ];
  let rows = allRows;
  let heroList = heroes;
  if (urlInterests.length) {
    const inCat = allCourses.filter((c) => urlInterests.includes(c.category));
    const byRating = [...inCat].sort((a, b) => b.rating - a.rating || b.members - a.members);
    const byMembers = [...inCat].sort((a, b) => b.members - a.members);
    const catLabel = joinEs(urlInterests);
    const chosen = personal && urlInterests.every((c) => dbInterests?.includes(c));
    rows = [
      {
        key: "destacados",
        title: forYouRow[0]?.title ?? "Destacados",
        items: byRating.slice(0, 8),
        reason: `Los ${NOUN.other} de ${catLabel} con mejor calificación de sus alumnos.`,
      },
      {
        key: "tendencia",
        title: "Los más elegidos",
        items: byMembers.slice(0, 8),
        reason: `Los ${NOUN.other} de ${catLabel} que más alumnos eligieron.`,
      },
      {
        key: "todos",
        title: `Porque te interesa ${catLabel}`,
        items: byRating,
        reason: chosen
          ? `Todo lo que hay de ${catLabel}, uno de los temas que elegiste al crear tu cuenta.`
          : `Todos los ${NOUN.other} de ${catLabel}, empezando por los mejor calificados.`,
      },
    ];
    if (byRating.length) heroList = byRating.slice(0, 5);
  }

  const controls: React.ReactNode = null;

  return (
    <Feed
      key={`feed|${activeInterests.join(",")}`}
      heroes={heroList}
      rows={rows}
      controls={controls}
      demo={allCourses.some((c) => c.demo)}
    />
  );
}
