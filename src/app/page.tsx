import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { RecommendationRefresh } from "@/components/RecommendationRefresh";
import { EmptyFeed } from "@/components/EmptyFeed";
import { Feed, type FeedRow } from "@/components/Feed";
import { getUserInterests, listCourses, listRecentViews } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, type Category } from "@/lib/types";
import { ShowFooterOnMobile } from "@/components/Footer";
import { recommendationActivity } from "@/lib/recommendation-data";
import { recommendPrograms } from "@/lib/recommendations";

export default function Discover({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <ShowFooterOnMobile />
      <Suspense
        fallback={
          <div
            className="h-[420px] animate-pulse bg-surface"
            aria-label="Cargando"
          />
        }
      >
        <Page searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
async function Page({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  if (query) redirect(`/buscar?q=${encodeURIComponent(query)}`);
  const raw = Array.isArray(sp.i) ? sp.i[0] : sp.i;
  const categories = [
    ...new Set(
      (raw ?? "")
        .split(",")
        .filter((c): c is Category => CATEGORIES.includes(c as Category)),
    ),
  ];
  const [catalogue, user] = await Promise.all([
    listCourses(),
    getCurrentUser(),
  ]);
  if (!catalogue.length) return <EmptyFeed />;
  const signed = Boolean(user && !user.demo);
  const [chosen, recent, activity] = signed
    ? await Promise.all([
        getUserInterests(user!.id),
        listRecentViews(user!.id, 12),
        recommendationActivity(user!.id),
      ])
    : [[], [], { signals: [], following: [], enrolled: [], ready: false }];
  const model = recommendPrograms(catalogue, {
    ...activity,
    chosen: chosen ?? [],
    userId: signed ? user!.id : undefined,
  });
  const ranked = model.ranked.map((r) => r.course);
  const recommended = new Set(ranked.map((c) => c.id));
  const popular = [...ranked].sort((a, b) => b.members - a.members).slice(0, 8);
  const cheap = ranked
    .filter((c) => c.priceCents < 10000)
    .sort((a, b) => a.priceCents - b.priceCents);
  const following = ranked.filter(
    (c) => c.creatorId && activity.following.includes(c.creatorId),
  );
  const exploration = model.ranked
    .filter(
      (r) =>
        r.exploration ||
        !model.interests.some((t) => t.category === r.course.category),
    )
    .map((r) => r.course);
  const first = ranked.slice(0, 12);
  const rows: FeedRow[] = [
    ...(first.length
      ? [
          {
            key: "para-ti",
            title: signed ? "Para ti" : "Descubre tu próximo programa",
            items: first,
            reason: model.hasPersonalization
              ? "Combinamos tus temas iniciales, actividad reciente y creadores que sigues. También incluimos otros temas para que descubras algo nuevo."
              : "Una selección del catálogo para empezar a explorar. Tu inicio se adapta conforme conoces programas.",
          },
        ]
      : []),
    ...(following.length
      ? [
          {
            key: "siguiendo",
            title: "De creadores que sigues",
            items: following,
            reason:
              "Nuevos programas para ti de las cuentas que decidiste seguir. Los programas que ya tienes no se repiten aquí.",
          },
        ]
      : []),
    ...(recent.length
      ? [
          {
            key: "recientes",
            title: "Vistos recientemente",
            items: recent,
            reason:
              "Programas que abriste, para que puedas retomarlos. Esta fila conserva también los que ya tienes.",
          },
        ]
      : []),
    ...(model.hasPersonalization && exploration.length
      ? [
          {
            key: "explorar",
            title: "Descubre otros temas",
            items: exploration.slice(0, 6),
            reason:
              "Hay espacio para aprender algo diferente: estos programas amplían los temas que estás explorando.",
          },
        ]
      : []),
    ...model.interests.slice(0, 2).flatMap((topic) => {
      const items = ranked.filter((c) => c.category === topic.category);
      return items.length >= 2
        ? [
            {
              key: `interes-${topic.category}`,
              title: `Para explorar ${topic.category}`,
              items,
              reason: topic.sources.length
                ? `Relacionado con tu actividad: ${topic.sources.join(", ").toLowerCase()}.`
                : `Elegiste ${topic.category} al comenzar. Tus nuevos intereses también cuentan.`,
            },
          ]
        : [];
    }),
    ...(popular.length
      ? [
          {
            key: "tendencia",
            title: "Los más elegidos",
            items: popular,
            reason:
              "Los programas con más alumnos dentro de las opciones disponibles para ti.",
          },
        ]
      : []),
    ...(cheap.length
      ? [
          {
            key: "ofertas",
            title: "Por menos de $100",
            items: cheap,
            reason:
              "Programas con un pago único menor a $100, según tus recomendaciones.",
            layout: "grid" as const,
            more: { href: "/ofertas", label: "Ver todas" },
          },
        ]
      : []),
  ];
  const inCategory = catalogue.filter((c) => categories.includes(c.category));
  const manual = categories.length > 0;
  const manualRows: FeedRow[] = [
    {
      key: "categoria",
      title: categories.join(" y "),
      items: inCategory,
      reason:
        "Estás explorando esta categoría. Este filtro no reemplaza los intereses de tu cuenta.",
    },
  ];
  const controls =
    signed && !manual ? (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-5">
        <p className="max-w-[65ch] text-sm text-muted">
          {recommended.size
            ? "Tu inicio evoluciona con lo que descubres."
            : "Ya exploraste estas opciones. Puedes buscar más programas o revisar tus intereses."}
        </p>
        <Link
          href="/intereses"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
        >
          Ver tus intereses →
        </Link>
      </div>
    ) : null;
  return (
    <>
      <RecommendationRefresh />
      <Feed
        key={`feed|${categories.join(",")}`}
        heroes={(manual ? inCategory : ranked).slice(0, 5)}
        rows={manual ? manualRows : rows}
        controls={controls}
        demo={catalogue.some((c) => c.demo)}
        personalize={signed && !manual && activity.ready}
        reasons={
          signed && !manual
            ? Object.fromEntries(
                model.ranked.map((r) => [r.course.id, r.reason]),
              )
            : undefined
        }
      />
    </>
  );
}
