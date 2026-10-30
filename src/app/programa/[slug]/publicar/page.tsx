import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NoTabBar } from "@/components/MobileTabBar";
import { ProgramNav } from "@/components/ProgramNav";
import { Stage } from "@/components/Stage";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProgram, publicationReady } from "@/lib/program-management";
import { listLessons, formatDuration } from "@/lib/lessons";
import { publicationChecks } from "@/lib/program-validation";
import { formatPrice } from "@/lib/pricing";
import { PublishControls } from "./PublishControls";

export const metadata = { title: "Publicar programa" };
export default function PublishPage({
  params,
}: PageProps<"/programa/[slug]/publicar">) {
  return (
    <main className="mx-auto max-w-[960px] px-4 pt-6 pb-16 md:pt-10">
      <NoTabBar />
      <Suspense
        fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface" />}
      >
        <Review params={params} />
      </Suspense>
    </main>
  );
}
async function Review({
  params,
}: {
  params: PageProps<"/programa/[slug]/publicar">["params"];
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.demo)
    redirect(
      `/entrar?next=${encodeURIComponent(`/programa/${slug}/publicar`)}`,
    );
  const course = await getOwnedProgram(slug, user.id);
  if (!course) notFound();
  const [lessons, enabled] = await Promise.all([
    listLessons(course.id),
    publicationReady(course.id),
  ]);
  const checks = publicationChecks(course, lessons);
  const ready = checks.every((c) => c.done);
  return (
    <>
      <ProgramNav course={course} step="publicar" />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">
            Último paso
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">
            {course.published
              ? "Tu programa está en el catálogo"
              : ready
                ? "Todo listo para publicar"
                : "Vamos a preparar tu programa"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {course.published
              ? "Gestiona su publicación desde aquí."
              : "Revisa estos detalles para que tus primeros alumnos encuentren un programa listo para aprender."}
          </p>
          <ul className="mt-6 grid gap-3">
            {checks.map((c) => (
              <li
                key={c.key}
                className="flex items-start gap-3 rounded-xl border border-line p-3.5"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${c.done ? "bg-good/15 text-good" : "bg-accent/15 text-accent"}`}
                  aria-label={c.done ? "Listo" : "Pendiente"}
                >
                  {c.done ? "✓" : "○"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{c.label}</p>
                  {!c.done && (
                    <p className="mt-1 text-xs text-muted">{c.detail}</p>
                  )}
                </div>
                {!c.done && (
                  <Link
                    href={`/programa/${slug}/${c.step}`}
                    className="shrink-0 py-1 text-xs font-bold text-accent"
                  >
                    Completar →
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {!course.trailerUrl && (
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Tu programa usará un trailer animado. Puedes{" "}
              <Link
                href={`/programa/${slug}/editar`}
                className="font-semibold text-accent"
              >
                subir tu propio video
              </Link>{" "}
              cuando quieras.
            </p>
          )}
          <PublishControls
            key={course.id}
            slug={slug}
            published={course.published}
            ready={ready}
            enabled={enabled}
          />
        </section>
        <aside className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="lz-thumb">
            <Stage course={course} badges={false} />
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Así se presenta tu programa
            </p>
            <h3 className="mt-2 break-words font-display text-xl font-bold">
              {course.title}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {course.creatorName} · {course.category}
            </p>
            <p className="mt-4 font-display text-3xl font-extrabold">
              {formatPrice(course.priceCents, course.currency)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {lessons.length} {lessons.length === 1 ? "clase" : "clases"}
              {lessons.length
                ? ` · ${formatDuration(lessons.reduce((n, l) => n + l.durationSeconds, 0)) || "Duración pendiente"}`
                : ""}
            </p>
            <p className="mt-4 break-words text-sm leading-relaxed text-muted">
              {course.description ||
                "Añade una descripción para presentar tu programa."}
            </p>
            <Link
              href={`/programa/${slug}?preview=1`}
              className="mt-5 block rounded-lg border border-line px-3 py-2.5 text-center text-sm font-semibold hover:border-fg/30"
            >
              Vista previa completa
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
