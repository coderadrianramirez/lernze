import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Poster } from "@/components/TrailerCard";
import { getCourseBySlug } from "@/lib/data";
import { COMMISSION_BPS, formatPrice, parseOrigin } from "@/lib/pricing";
import { enrollAction } from "./actions";

export async function generateMetadata({ params }: PageProps<"/curso/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course?.title ?? "Curso" };
}

export default function CoursePage({ params, searchParams }: PageProps<"/curso/[slug]">) {
  return (
    <main className="mx-auto max-w-[900px] px-4 pt-5 pb-12">
      <Link href="/" className="text-sm text-muted hover:text-fg">
        ← Volver a descubrir
      </Link>
      <Suspense fallback={<div className="mt-4 aspect-video animate-pulse rounded-xl bg-surface" aria-label="Cargando" />}>
        <CourseDetail params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function CourseDetail({
  params,
  searchParams,
}: {
  params: PageProps<"/curso/[slug]">["params"];
  searchParams: PageProps<"/curso/[slug]">["searchParams"];
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const origin = parseOrigin(sp.src);
  const done = sp.ok === "1";

  return (
      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Poster course={course} />
          <h1 className="mt-5 font-display text-[clamp(28px,4vw,40px)] leading-[1.05] font-extrabold tracking-tight text-balance">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            por <b className="text-fg">{course.creatorName}</b> · {course.category}
            {course.rating > 0 && <> · {course.rating.toFixed(1)} de 5</>} · {course.members.toLocaleString("es")} miembros
          </p>
          <p className="mt-4 max-w-[65ch] text-[#cfd0da]">{course.description || "Este curso aún no tiene descripción."}</p>
          <p className="mt-3 max-w-[65ch] text-[#cfd0da]">
            Incluye clases, comunidad con foro, calendario de sesiones en vivo y tabla de posiciones.
          </p>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface p-4">
          <div className="font-display text-[32px] font-extrabold">{formatPrice(course.priceCents, course.currency)}</div>
          <p className="mt-1 text-[13px] text-muted">Pago único. Compra simulada: todavía no se cobra.</p>
          {done ? (
            <p role="status" className="mt-4 rounded-lg bg-good/15 p-3 text-sm text-good">
              Listo, quedaste inscrito en este curso (simulado).
            </p>
          ) : (
            <form action={enrollAction} className="mt-4">
              <input type="hidden" name="slug" value={course.slug} />
              <input type="hidden" name="origin" value={origin} />
              <button className="w-full cursor-pointer rounded-xl bg-accent px-4 py-3 font-bold text-accent-ink">
                Entrar a la comunidad
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-muted">
            Origen de esta visita: {origin === "discover" ? "Discover" : origin === "agent" ? "clip de un agente" : "tráfico propio"}
            . Comisión de Lernze: {COMMISSION_BPS[origin] / 100}%.
          </p>
        </aside>
      </div>
  );
}
