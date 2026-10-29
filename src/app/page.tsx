import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EmptyFeed } from "@/components/EmptyFeed";
import { Feed, type FeedRow } from "@/components/Feed";
import { NOUN, cap } from "@/lib/copy";
import { getUserInterests, listCourses, listRecentViews, rankForInterests } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, type Category, type Course } from "@/lib/types";
import { ShowFooterOnMobile } from "@/components/Footer";

function parseInterests(raw: string | string[] | undefined): Category[] {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return [];
  return v.split(",").filter((x): x is Category => (CATEGORIES as string[]).includes(x));
}

/** Las `n` categorías que más aparecen en una lista de programas. */
function topCategories(courses: Course[], n: number): Category[] {
  const counts = new Map<Category, number>();
  courses.forEach((c) => counts.set(c.category, (counts.get(c.category) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([c]) => c);
}

function joinEs(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export default function Discover({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <ShowFooterOnMobile />
      <Suspense fallback={<div className="h-[420px] animate-pulse bg-surface" aria-label="Cargando" />}>
        <Page searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Page({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  if (query) redirect(`/buscar?q=${encodeURIComponent(query)}`);

  // Intereses: URL param tiene prioridad (filtro manual); si no, cargamos desde DB
  const urlInterests = parseInterests(sp.i);
  const [allCourses, user] = await Promise.all([listCourses(), getCurrentUser()]);

  // Intereses persistidos (null = onboarding pendiente, [] = no eligió) y programas que abrió hace poco.
  const signedIn = Boolean(user && !user.demo);
  const [dbInterests, recentViews] = signedIn
    ? await Promise.all([getUserInterests(user!.id), listRecentViews(user!.id, 12)])
    : [null, []];

  // Si no eligió temas, los deducimos de lo que vio: las dos categorías que más abrió.
  const chosenInterests = (dbInterests ?? []).filter((x): x is Category => (CATEGORIES as string[]).includes(x));
  const inferredInterests: Category[] = chosenInterests.length ? [] : topCategories(recentViews, 2);

  // Intereses activos: URL > elegidos > deducidos de lo visto
  const activeInterests: Category[] = urlInterests.length
    ? urlInterests
    : chosenInterests.length
      ? chosenInterests
      : inferredInterests;
  const inferred = !urlInterests.length && !chosenInterests.length && inferredInterests.length > 0;

  if (allCourses.length === 0) return <EmptyFeed />;

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
  const personal = signedIn && chosenInterests.length > 0;
  const label = joinEs(activeInterests);
  const forYouRow: FeedRow[] = hasInterests
    ? [
        {
          key: "para-ti",
          title: personal || inferred ? "Para ti" : "Destacados",
          items: forYou,
          reason: personal
            ? `Según los temas que elegiste (${label}). Primero van los mejor calificados por sus alumnos.`
            : inferred
              ? `Según lo que viste últimamente (${label}). Elige tus temas en Mi cuenta para afinarlo.`
              : `Los ${NOUN.other} de ${label} con mejor calificación de sus alumnos.`,
        },
      ]
    : [];

  // "Vistos recientemente" y "Porque viste X", como en cualquier plataforma de video.
  const viewedIds = new Set(recentViews.map((c) => c.id));
  const recentRow: FeedRow[] =
    recentViews.length >= 2
      ? [{ key: "recientes", title: "Vistos recientemente", items: recentViews, reason: `Los últimos ${NOUN.other} que abriste, para retomarlos.` }]
      : [];
  const last = recentViews[0];
  const becauseItems = last
    ? allCourses
        .filter((c) => c.category === last.category && !viewedIds.has(c.id))
        .sort((a, b) => b.rating - a.rating || b.members - a.members)
    : [];
  const becauseRow: FeedRow[] =
    last && becauseItems.length >= 2
      ? [
          {
            key: "porque-viste",
            title: `Porque viste ${last.title}`,
            items: becauseItems,
            reason: `Más ${NOUN.other} de ${last.category} que todavía no abriste, el tema de lo último que viste.`,
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
            reason: inferred
              ? `Viste varios ${NOUN.other} de ${cat} últimamente.`
              : `Todo lo que hay de ${cat}, uno de los temas que elegiste al crear tu cuenta.`,
          }
        : null;
    })
    .filter((r): r is FeedRow => r !== null);

  const allRows: FeedRow[] = [
    ...forYouRow,
    ...recentRow,
    ...becauseRow,
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
