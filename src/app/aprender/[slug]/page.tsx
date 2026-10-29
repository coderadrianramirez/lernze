import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { NoTabBar } from "@/components/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";
import { NOUN, programPath } from "@/lib/copy";
import { getCourseBySlug } from "@/lib/data";
import {
  clock,
  completedLessonIds,
  formatDuration,
  getOwnCourseId,
  isEnrolled,
  lessonVideoUrl,
  listLessons,
} from "@/lib/lessons";
import { LessonPlayer } from "./LessonPlayer";

export async function generateMetadata({ params }: PageProps<"/aprender/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course ? `Clases · ${course.title}` : "Clases" };
}

export default function ClassroomPage({ params, searchParams }: PageProps<"/aprender/[slug]">) {
  return (
    <main className="mx-auto max-w-[1400px] px-4 pt-4 pb-16 md:px-5 md:pt-6">
      <NoTabBar />
      <Suspense fallback={<div className="aspect-video animate-pulse rounded-2xl bg-surface" aria-label="Cargando" />}>
        <Classroom params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Classroom({
  params,
  searchParams,
}: {
  params: PageProps<"/aprender/[slug]">["params"];
  searchParams: PageProps<"/aprender/[slug]">["searchParams"];
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [course, user] = await Promise.all([getCourseBySlug(slug), getCurrentUser()]);
  if (!course) notFound();

  const signedIn = Boolean(user && !user.demo);
  const [lessons, enrolled, ownId, completed] = await Promise.all([
    listLessons(course.id),
    signedIn ? isEnrolled(user!.id, course.id) : false,
    signedIn ? getOwnCourseId(slug, user!.id) : null,
    signedIn ? completedLessonIds(user!.id) : Promise.resolve(new Set<string>()),
  ]);
  const hasAccess = enrolled || ownId === course.id;

  // Sin acceso solo se ven las clases de vista previa.
  const requested = typeof sp.clase === "string" ? lessons.find((l) => l.id === sp.clase) : undefined;
  const visible = hasAccess ? lessons : lessons.filter((l) => l.isPreview);
  if (!visible.length) {
    if (!hasAccess) redirect(programPath(slug));
  }

  const current =
    (requested && (hasAccess || requested.isPreview) ? requested : undefined) ??
    (hasAccess ? lessons.find((l) => !completed.has(l.id)) ?? lessons[0] : visible[0]);

  const idx = current ? lessons.findIndex((l) => l.id === current.id) : -1;
  const navigable = (i: number) => (i >= 0 && i < lessons.length && (hasAccess || lessons[i].isPreview) ? lessons[i] : null);
  const prev = navigable(idx - 1);
  const next = navigable(idx + 1);
  const href = (id: string) => `/aprender/${slug}?clase=${id}`;
  const src = current?.videoPath ? await lessonVideoUrl(current.videoPath) : null;

  const doneCount = lessons.filter((l) => completed.has(l.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const total = lessons.reduce((s, l) => s + l.durationSeconds, 0);

  return (
    <>
      <Link href={programPath(slug)} className="-ml-1 inline-flex items-center gap-1 px-1 py-1 text-sm font-medium text-muted hover:text-fg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="truncate">{course.title}</span>
      </Link>

      {sp.bienvenida === "1" && hasAccess && (
        <div role="status" className="mt-3 rounded-2xl border border-good/30 bg-good/10 px-4 py-3 text-sm">
          <b className="text-good">¡Ya eres parte!</b> <span className="text-[#cfd0da]">Tienes acceso a todas las clases. Empieza cuando quieras.</span>
        </div>
      )}

      {!lessons.length ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-display text-xl font-bold">Las clases están en camino</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-muted">
            {ownId === course.id
              ? `Todavía no subiste clases a este ${NOUN.one}.`
              : `${course.creatorName} está preparando el contenido. Las clases van a aparecer aquí en cuanto las publique.`}
          </p>
          {ownId === course.id && (
            <Link href={`/programa/${slug}/clases`} className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink">
              Agregar clases
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-3 grid gap-6 md:mt-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* clase actual */}
          <div className="min-w-0">
            {current && (
              <>
                <LessonPlayer
                  key={current.id}
                  slug={slug}
                  lessonId={current.id}
                  src={src}
                  done={completed.has(current.id)}
                  canTrack={hasAccess}
                  nextHref={next ? href(next.id) : null}
                  prevHref={prev ? href(prev.id) : null}
                />
                <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted">Clase {idx + 1} de {lessons.length}</p>
                <h1 className="mt-1 font-display text-[clamp(22px,3vw,32px)] leading-tight font-extrabold tracking-tight">{current.title}</h1>
                {current.description && <p className="mt-3 max-w-[70ch] leading-relaxed whitespace-pre-line text-[#cfd0da]">{current.description}</p>}
              </>
            )}

            {!hasAccess && (
              <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-accent/40 bg-accent/5 p-5">
                <p className="min-w-0 flex-1 text-sm">
                  <b>Estás viendo una clase de vista previa.</b>{" "}
                  <span className="text-muted">Únete para ver las {lessons.length} clases y guardar tu progreso.</span>
                </p>
                <Link href={`${programPath(slug)}?src=discover`} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink">
                  Ver el {NOUN.one}
                </Link>
              </div>
            )}
          </div>

          {/* lista de clases */}
          <aside className="lg:sticky lg:top-[104px] lg:self-start">
            <div className="rounded-2xl border border-line bg-surface">
              <div className="border-b border-line p-4">
                <p className="font-display font-bold">Contenido</p>
                <p className="mt-0.5 text-xs text-muted">
                  {lessons.length} {lessons.length === 1 ? "clase" : "clases"}
                  {total ? ` · ${formatDuration(total)}` : ""}
                </p>
                {hasAccess && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Tu progreso</span>
                      <span className="font-semibold">
                        {doneCount}/{lessons.length} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del programa">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <ol className="max-h-[60vh] overflow-y-auto lg:max-h-[calc(100vh-280px)]">
                {lessons.map((l, i) => {
                  const on = l.id === current?.id;
                  const open = hasAccess || l.isPreview;
                  const isDone = completed.has(l.id);
                  const inner = (
                    <>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isDone ? "bg-good text-ink" : on ? "bg-accent text-accent-ink" : "bg-surface-2"
                        }`}
                      >
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" aria-label="Completada">
                            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${on ? "font-bold" : "font-medium"}`}>{l.title}</span>
                        <span className="text-xs text-muted">
                          {l.durationSeconds ? clock(l.durationSeconds) : "—"}
                          {!hasAccess && l.isPreview ? " · Vista previa" : ""}
                        </span>
                      </span>
                      {!open && (
                        <svg className="shrink-0 text-muted/60" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-label="Bloqueada">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                      )}
                    </>
                  );
                  const cls = `flex items-center gap-3 px-4 py-3 ${i ? "border-t border-line" : ""} ${on ? "bg-surface-2" : ""}`;
                  return (
                    <li key={l.id}>
                      {open ? (
                        <Link href={href(l.id)} aria-current={on ? "true" : undefined} className={`${cls} transition-colors hover:bg-surface-2`}>
                          {inner}
                        </Link>
                      ) : (
                        <div className={`${cls} opacity-60`}>{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
