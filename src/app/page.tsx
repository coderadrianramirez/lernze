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

function discoverHref(interests: Category[], fmt: "h" | "v") {
  const p = new URLSearchParams();
  if (interests.length) p.set("i", interests.join(","));
  if (fmt === "v") p.set("f", "v");
  const q = p.toString();
  return q ? `/?${q}` : "/";
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
  const fmt: "h" | "v" = sp.f === "v" ? "v" : "h";
  const courses = await listCourses();

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 pt-5">
        <section className="rounded-2xl border border-line bg-surface p-8 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{`Aún no hay ${NOUN.other} publicados`}</h1>
          <p className="mx-auto mt-2 max-w-[48ch] text-muted">
            {`El Discover feed se llena con los ${NOUN.other} de los creadores. Publica el primero y aparecerá aquí con su trailer.`}
          </p>
          <Link href="/crear" className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink">
            {`Publicar un ${NOUN.one}`}
          </Link>
        </section>
      </div>
    );
  }

  const forYou = rankForInterests(courses, interests);
  const trending = [...courses].sort((a, b) => b.members - a.members).slice(0, 8);
  const rated = [...courses].filter((c) => c.rating > 0).sort((a, b) => b.rating - a.rating || b.members - a.members);
  const cheap = courses.filter((c) => c.priceCents < 10_000).sort((a, b) => a.priceCents - b.priceCents);
  const hero = forYou[0] ?? trending[0];

  const rows: FeedRow[] = [
    ...(forYou.length ? [{ key: "para-ti", title: "Para ti", items: forYou }] : []),
    { key: "tendencia", title: "Tendencia esta semana", items: trending },
    ...(rated.length ? [{ key: "valorados", title: "Mejor valorados", items: rated }] : []),
    ...(cheap.length ? [{ key: "baratos", title: "Por menos de $100", items: cheap }] : []),
  ];

  const toggle = (cat: Category) =>
    discoverHref(interests.includes(cat) ? interests.filter((c) => c !== cat) : [...interests, cat], fmt);

  const controls = (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-3.5">
      <div key="intereses" role="group" aria-label="Tus intereses" className="flex items-center gap-2 overflow-x-auto">
        <span key="etiqueta" className="mr-0.5 text-[13px] whitespace-nowrap text-muted">Tus intereses</span>
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
      <div key="formato" role="group" aria-label="Formato de portada" className="flex rounded-[10px] border border-line bg-surface p-[3px] text-[13px]">
        {(["h", "v"] as const).map((f) => (
          <Link
            key={f}
            href={discoverHref(interests, f)}
            aria-current={fmt === f ? "true" : undefined}
            scroll={false}
            className={`rounded-[7px] px-3 py-[5px] ${fmt === f ? "bg-surface-2 text-fg" : "text-muted"}`}
          >
            {f === "h" ? "Horizontal" : "Vertical"}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <Feed
      key={`${fmt}|${interests.join(",")}`}
      hero={hero}
      rows={rows}
      fmt={fmt}
      controls={controls}
      demo={courses.some((c) => c.demo)}
    />
  );
}
