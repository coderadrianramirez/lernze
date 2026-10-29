import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NoTabBar } from "@/components/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";
import { programPath } from "@/lib/copy";
import { getCourseBySlug } from "@/lib/data";
import { formatDuration, getOwnCourseId, lessonsReady, listLessons } from "@/lib/lessons";
import { LessonEditor } from "./LessonEditor";

export const metadata: Metadata = { title: "Clases del programa" };

export default function LessonsPage({ params }: PageProps<"/programa/[slug]/clases">) {
  return (
    <main className="mx-auto max-w-[760px] px-4 pt-6 pb-16 md:pt-10">
      <NoTabBar />
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface" />}>
        <Editor params={params} />
      </Suspense>
    </main>
  );
}

async function Editor({ params }: { params: PageProps<"/programa/[slug]/clases">["params"] }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.demo) redirect(`/entrar?next=${encodeURIComponent(`/programa/${slug}/clases`)}`);

  const courseId = await getOwnCourseId(slug, user.id);
  if (!courseId) redirect(programPath(slug));

  const [course, ready, lessons] = await Promise.all([getCourseBySlug(slug), lessonsReady(), listLessons(courseId)]);
  const total = lessons.reduce((s, l) => s + l.durationSeconds, 0);

  return (
    <>
      <Link href={programPath(slug)} className="-ml-1 inline-flex items-center gap-1 px-1 py-1 text-sm font-medium text-muted hover:text-fg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
        Ver el programa
      </Link>
      <h1 className="mt-3 font-display text-[clamp(26px,4vw,36px)] leading-tight font-extrabold tracking-tight">Clases</h1>
      <p className="mt-1 text-muted">
        {course?.title ?? "Tu programa"}
        {lessons.length > 0 && ` · ${lessons.length} ${lessons.length === 1 ? "clase" : "clases"}${total ? ` · ${formatDuration(total)}` : ""}`}
      </p>

      {!ready ? (
        <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-5">
          <p className="font-semibold">Las clases todavía no están activadas</p>
          <p className="mt-1 text-sm text-muted">
            Falta ejecutar la migración <code className="text-fg">0007_lessons.sql</code> en Supabase. Cuando esté, vas a poder subir
            tus clases desde aquí.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <LessonEditor slug={slug} courseId={courseId} lessons={lessons} />
          <p className="mt-6 text-[13px] text-muted">
            Los videos de las clases son privados: solo los ven quienes se unieron al programa, salvo las marcadas como vista
            previa.
          </p>
        </div>
      )}
    </>
  );
}
