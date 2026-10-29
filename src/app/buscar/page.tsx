import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CourseListItem } from "@/components/CourseListItem";
import { CATEGORY_META } from "@/lib/categories";
import { NOUN } from "@/lib/copy";
import { listCourses } from "@/lib/data";
import { searchCourses } from "@/lib/search";
import { CATEGORIES } from "@/lib/types";
import { SearchField } from "./SearchField";

export const metadata: Metadata = { title: "Buscar" };

export default function BuscarPage({ searchParams }: PageProps<"/buscar">) {
  return (
    <main className="mx-auto max-w-[860px] px-4 pt-5 pb-10 md:pt-10">
      <Suspense fallback={<div className="h-13 animate-pulse rounded-2xl bg-surface" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/buscar">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const all = await listCourses();
  const results = q ? searchCourses(all, q) : [];
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, all.filter((x) => x.category === c).length]));
  const popular = [...all].sort((a, b) => b.members - a.members).slice(0, 5);

  const categories = (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold tracking-tight">Explorar por categoría</h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <li key={c}>
            <Link
              href={`/?i=${encodeURIComponent(c)}`}
              className="lz-empty-cat block active:scale-[0.98]"
              style={{ "--glow": CATEGORY_META[c].glow } as CSSProperties}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={CATEGORY_META[c].icon} />
              </svg>
              <p className="mt-4 font-semibold text-fg">{c}</p>
              <p className="text-xs text-muted">
                {counts[c]} {counts[c] === 1 ? NOUN.one : NOUN.other}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <>
      <h1 className="sr-only">Buscar</h1>
      <SearchField initial={q} />

      {!q && (
        <>
          {categories}
          <section className="mt-10">
            <h2 className="font-display text-lg font-bold tracking-tight">Los más elegidos</h2>
            <ul className="mt-3 -mx-2 flex flex-col">
              {popular.map((c) => (
                <li key={c.id}>
                  <CourseListItem course={c} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {q && results.length > 0 && (
        <section className="mt-6" aria-live="polite">
          <p className="text-sm text-muted">
            {results.length} {results.length === 1 ? "resultado" : "resultados"} para “{q}”
          </p>
          <ul className="mt-3 -mx-2 flex flex-col">
            {results.map((c) => (
              <li key={c.id}>
                <CourseListItem course={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && results.length === 0 && (
        <div aria-live="polite">
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center">
            <p className="font-semibold">Sin resultados para “{q}”</p>
            <p className="mt-1 text-sm text-muted">Prueba con otra palabra o explora una categoría.</p>
          </div>
          {categories}
        </div>
      )}
    </>
  );
}
