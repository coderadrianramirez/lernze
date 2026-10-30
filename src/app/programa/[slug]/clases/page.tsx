import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NoTabBar } from "@/components/MobileTabBar";
import { ProgramNav } from "@/components/ProgramNav";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProgram } from "@/lib/program-management";
import { lessonsReady, listLessons } from "@/lib/lessons";
import { LessonEditor } from "./LessonEditor";

export const metadata = { title: "Clases del programa" };
export default function LessonsPage({
  params,
  searchParams,
}: PageProps<"/programa/[slug]/clases">) {
  return (
    <main className="mx-auto max-w-[760px] px-4 pt-6 pb-16 md:pt-10">
      <NoTabBar />
      <Suspense
        fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface" />}
      >
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
async function Editor({
  params,
  searchParams,
}: {
  params: PageProps<"/programa/[slug]/clases">["params"];
  searchParams: PageProps<"/programa/[slug]/clases">["searchParams"];
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.demo)
    redirect(`/entrar?next=${encodeURIComponent(`/programa/${slug}/clases`)}`);
  const course = await getOwnedProgram(slug, user.id);
  if (!course) notFound();
  const [ready, lessons, sp] = await Promise.all([
    lessonsReady(),
    listLessons(course.id),
    searchParams,
  ]);
  return (
    <>
      <ProgramNav course={course} step="clases" />
      {sp.creado === "1" && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-good/30 bg-good/10 p-4 text-sm text-good"
        >
          Borrador guardado. Ahora añade las clases de tu programa.
        </p>
      )}
      <h2 className="font-display text-xl font-bold">Tus clases</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Ordénalas como quieres que las vean tus alumnos. Puedes guardar clases
        incompletas mientras tu programa esté fuera del catálogo.
      </p>
      {!ready ? (
        <p
          role="alert"
          className="rounded-xl border border-line bg-surface p-5 text-sm text-muted"
        >
          No pudimos cargar las clases. Inténtalo de nuevo más tarde.
        </p>
      ) : (
        <LessonEditor
          slug={slug}
          courseId={course.id}
          lessons={lessons}
          published={course.published}
        />
      )}
      <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Los videos son privados, salvo las vistas previas de programas
          publicados.
        </p>
        <Link
          href={`/programa/${slug}/publicar`}
          className="shrink-0 rounded-xl bg-accent px-5 py-3 text-center text-sm font-bold text-accent-ink"
        >
          Revisar y publicar →
        </Link>
      </div>
    </>
  );
}
