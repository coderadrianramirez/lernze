import type { Metadata } from "next";
import { Suspense } from "react";
import { Feed, type FeedRow } from "@/components/Feed";
import { NOUN, cap } from "@/lib/copy";
import { listCourses } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";

export const metadata: Metadata = { title: "Ofertas especiales" };

const LIMIT_CENTS = 10_000;

export default function OfertasPage() {
  return (
    <main>
      <Suspense fallback={<div className="h-[420px] animate-pulse bg-surface" aria-label="Cargando" />}>
        <Ofertas />
      </Suspense>
    </main>
  );
}

async function Ofertas() {
  const all = await listCourses();
  const cheap = all
    .filter((c) => c.priceCents < LIMIT_CENTS)
    .sort((a, b) => b.rating - a.rating || b.members - a.members);

  if (cheap.length === 0) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 pt-10">
        <section className="rounded-2xl border border-line bg-surface p-12 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">Por ahora no hay ofertas</h1>
          <p className="mx-auto mt-2 max-w-[44ch] text-muted">{`Volvé pronto: acá vas a encontrar ${NOUN.other} por menos de $100.`}</p>
        </section>
      </div>
    );
  }

  const rows: FeedRow[] = CATEGORIES.map((cat): FeedRow | null => {
    const items = cheap.filter((c) => c.category === cat);
    return items.length
      ? { key: `oferta-${cat}`, title: cat, items, reason: `${cap(NOUN.other)} de ${cat} que cuestan menos de $100.` }
      : null;
  }).filter((r): r is FeedRow => r !== null);

  return <Feed key="ofertas" heroes={cheap.slice(0, 5)} rows={rows} controls={null} demo={all.some((c) => c.demo)} />;
}
